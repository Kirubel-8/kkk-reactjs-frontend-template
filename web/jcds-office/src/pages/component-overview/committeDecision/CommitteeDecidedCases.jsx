import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Snackbar,
  Alert,
  Chip,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Checkbox,
  Paper,
  Grid,
  Tabs,
  Tab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Search, Visibility, Delete, Person, CheckCircle, Pending, Assignment, SelectAll, ClearAll } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import finalDecisionService from '../../../service/finalDecisionService.service';
import informExpertService from '../../../service/informExpert.service';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';

const FILTERS = [
  { label: 'All Cases', value: 'all' },
  { label: 'Pending Voting', value: 'pending_voting' },
  { label: 'Completed', value: 'completed' }
];

export default function CouncilReviewCases() {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('member');

  // Add these permission states
  const [canAssignMembers, setCanAssignMembers] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Add selection states
  const [selectedRows, setSelectedRows] = useState([]); // Array of selected case IDs
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  // Case Type Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseTypes, setCaseTypes] = useState([]);
  const [selectedCaseType, setSelectedCaseType] = useState('');

  // Voters Modal - Updated for multiple cases
  const [assignVotersModalOpen, setAssignVotersModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedVoters, setSelectedVoters] = useState([]);
  const [selectedCasesForAssignment, setSelectedCasesForAssignment] = useState([]); // Cases to assign voters to
  const [assignmentMode, setAssignmentMode] = useState('single'); // 'single' or 'multiple'

  // Remove confirmation modal
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Open single case assign modal
  const handleOpenAssignModal = (row) => {
    setSelectedCase(row);
    setAssignModalOpen(true);
    fetchCaseTypes();
  };

  const handleCloseAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedCase(null);
    setSelectedCaseType('');
  };

  // Open voters modal (single or multiple)
  const handleOpenAssignVotersModal = async (mode = 'single', row = null) => {
    // Check permission before opening
    if (!canAssignMembers) {
      showSnackbar('You do not have permission to assign council members', 'error');
      return;
    }

    setAssignmentMode(mode);

    if (mode === 'single' && row) {
      setSelectedCase(row);
      setSelectedCasesForAssignment([row]);
    } else if (mode === 'multiple') {
      if (selectedRows.length === 0) {
        showSnackbar('Please select at least one case to assign members', 'warning');
        return;
      }
      // Get the selected rows data
      const selectedCasesData = rows.filter((row) => selectedRows.includes(row.case_id));
      setSelectedCasesForAssignment(selectedCasesData);
      setSelectedCase(null);
    }

    setAssignVotersModalOpen(true);

    try {
      // Fetch available council members
      const members = await finalDecisionService.getAvailableCouncilMembers();
      setAllUsers(members || []);

      // For single case mode, load existing assignments
      if (mode === 'single' && row) {
        const existingAssignments = await finalDecisionService.getAssignedMembersForCase(row.case_id);
        const assignedUserIds = existingAssignments.map((assignment) => assignment.council_user_id.toString());
        setSelectedVoters(assignedUserIds);
      } else {
        // For multiple cases, start with empty selection
        setSelectedVoters([]);
      }
    } catch (error) {
      console.error('Error fetching council members:', error);
      showSnackbar('Failed to load council members', 'error');
      setSelectedVoters([]);
    }
  };

  const handleCloseAssignVotersModal = () => {
    setAssignVotersModalOpen(false);
    setSelectedCase(null);
    setSelectedCasesForAssignment([]);
    setSelectedVoters([]);
  };

  // Row selection handlers
  const handleRowSelection = (caseId) => {
    if (selectedRows.includes(caseId)) {
      setSelectedRows(selectedRows.filter((id) => id !== caseId));
    } else {
      setSelectedRows([...selectedRows, caseId]);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([]);
      setIsSelectAll(false);
    } else {
      const allCaseIds = filteredRows.map((row) => row.case_id);
      setSelectedRows(allCaseIds);
      setIsSelectAll(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedRows([]);
    setIsSelectAll(false);
  };

  // Open remove confirmation modal
  const handleOpenRemoveModal = (memberId) => {
    setMemberToRemove(memberId);
    setRemoveModalOpen(true);
  };

  const handleCloseRemoveModal = () => {
    setRemoveModalOpen(false);
    setMemberToRemove(null);
  };

  // Get user role and permissions
  const getUserRoleAndPermissions = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);

        // Extract permissions
        let permissions = [];
        if (user.permissions && Array.isArray(user.permissions)) {
          permissions = user.permissions;
        } else if (user.roles && Array.isArray(user.roles)) {
          user.roles.forEach((role) => {
            if (role.permissions && Array.isArray(role.permissions)) {
              permissions = [...permissions, ...role.permissions];
            }
          });
        }

        // Check for assign_members permission
        const hasAssignMembers = permissions.some((perm) => perm.resource === 'CommitteeDecided' && perm.action === 'assign_members');

        const isCouncilHead = hasAssignMembers;

        setUserRole(isCouncilHead ? 'head' : 'member');
        setCanAssignMembers(isCouncilHead);
        setUserPermissions(permissions);
        setCurrentUser(user);

        console.log('User role and permissions:', {
          userId: user.user_id,
          isCouncilHead,
          hasAssignMembers,
          totalPermissions: permissions.length
        });

        return isCouncilHead ? 'head' : 'member';
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return 'member';
  };

  const fetchCouncilCases = async () => {
    setLoading(true);
    try {
      const res = await finalDecisionService.getCasesUnderCouncilReview();
      const formatted = (res.data || [])
        .filter((item) => item.case_id)
        .map((item) => {
          const currentUser = JSON.parse(localStorage.getItem('user'));
          const currentUserId = currentUser?.user_id || currentUser?.id;

          const allVotes = item.case_decision_votes || [];
          const assignedMembersCount = allVotes.length;
          const votedCount = allVotes.filter((vote) => vote.is_voted).length;
          const pendingCount = assignedMembersCount - votedCount;
          const completionPercentage = assignedMembersCount > 0 ? (votedCount / assignedMembersCount) * 100 : 0;

          const assignedMembers = allVotes.map((vote) => ({
            id: vote.council_user_id,
            name: vote.councilMember?.full_name || 'Unknown Member',
            voted: vote.is_voted,
            decision: vote.decisionStatus?.name || 'Pending',
            vote_at: vote.vote_at,
            status_id: vote.status_id
          }));

          const userVote = allVotes.find((vote) => vote.council_user_id === currentUserId);
          const userDecision = userVote?.is_voted ? userVote.decisionStatus?.name : 'Not Voted';

          return {
            case_id: item.case_id,
            case_number: item.case_number,
            judge_name: item.disciplinary_complaint?.judge_name || 'N/A',
            file_number: item.disciplinary_complaint?.file_number || 'N/A',
            court_office: item.disciplinary_complaint?.court_office || 'N/A',
            applicant_name: item.disciplinary_complaint?.applicant?.full_name || 'N/A',
            status: item.status,
            committee_priority: item.committee_priority || 'N/A',
            createdAt: new Date(item.createdAt).toISOString().split('T')[0],
            department_name: item.assigned_committee_ref?.name || 'N/A',
            total_assigned: assignedMembersCount,
            voted_count: votedCount,
            pending_count: pendingCount,
            completion_percentage: completionPercentage,
            assigned_members: assignedMembers,
            final_decision: item.final_decision?.status?.name || null,
            final_decision_date: item.final_decision?.created_at || null,
            is_assigned_to_me: !!userVote,
            my_decision: userDecision,
            has_voted: userVote?.is_voted || false,
            case_type_name: item.case_type?.name || '',
            is_selected: selectedRows.includes(item.case_id)
          };
        });
      setRows(formatted);
    } catch (error) {
      console.error('Error fetching council cases:', error);
      showSnackbar('Failed to load council review cases.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseTypes = async () => {
    try {
      const res = await informExpertService.getCaseTypes();
      setCaseTypes(res.data || []);
    } catch (error) {
      console.error('Error fetching case types:', error);
      showSnackbar('Failed to load case types', 'error');
    }
  };

  const handleAssignVoters = async () => {
    try {
      // ============================
      //  SINGLE CASE ASSIGNMENT
      // ============================
      if (assignmentMode === 'single') {
        if (!selectedCase) {
          showSnackbar('No case selected', 'warning');
          return;
        }

        // 1. Get existing assigned members
        const existingAssignments = await finalDecisionService.getAssignedMembersForCase(selectedCase.case_id);
        const existingIds = existingAssignments.map((a) => a.council_user_id.toString());

        // 2. Compute future total
        const finalMembers = new Set([...existingIds, ...selectedVoters]);
        if (finalMembers.size < 3) {
          showSnackbar('At least 3 council members are required.', 'error');
          return;
        }

        // 3. Detect additions and removals
        const usersToAdd = selectedVoters.filter((id) => !existingIds.includes(id));
        let usersToRemove = existingIds.filter((id) => !selectedVoters.includes(id));

        // 4. Prevent removing members who already voted
        const assigned = selectedCase.assigned_members || [];
        const votedMembers = assigned.filter((m) => m.voted).map((m) => m.id.toString());

        const blockedRemovals = usersToRemove.filter((id) => votedMembers.includes(id));
        if (blockedRemovals.length > 0) {
          showSnackbar('Cannot remove members who already voted.', 'warning');
          return;
        }

        // 5. Ensure removal does not violate minimum 3 rule
        const remainingCount = finalMembers.size - usersToRemove.length;
        if (remainingCount < 3) {
          showSnackbar('Cannot remove member(s). A case needs at least 3 assigned.', 'error');
          return;
        }

        // 6. Apply add/remove
        if (usersToAdd.length > 0) {
          await finalDecisionService.assignMembersToCases([selectedCase.case_id], usersToAdd);
        }

        if (usersToRemove.length > 0) {
          await finalDecisionService.removeMembersFromCase(selectedCase.case_id, usersToRemove);
        }

        showSnackbar('Council members updated successfully.', 'success');
      }

      // =================================
      // MULTIPLE CASE ASSIGNMENT
      // =================================
      else if (assignmentMode === 'multiple') {
        if (selectedCasesForAssignment.length === 0) {
          showSnackbar('Select at least one case.', 'warning');
          return;
        }

        if (selectedVoters.length < 3) {
          showSnackbar('Select at least 3 council members.', 'warning');
          return;
        }

        const caseIds = selectedCasesForAssignment.map((c) => c.case_id);

        // Assign same voters to all selected cases
        await Promise.all(caseIds.map((id) => finalDecisionService.assignMembersToCases([id], selectedVoters)));

        showSnackbar(`Assigned ${selectedVoters.length} members to ${caseIds.length} cases.`, 'success');
      }

      fetchCouncilCases();
      handleCloseAssignVotersModal();
    } catch (error) {
      console.error('Error assigning voters:', error);
      showSnackbar(error.response?.data?.error || 'Failed to assign council members', 'error');
    }
  };

  // Remove single member from case
  const handleRemoveMember = async () => {
    if (!selectedCase || !memberToRemove) {
      showSnackbar('Invalid operation', 'error');
      return;
    }

    try {
      await finalDecisionService.removeMembersFromCase(selectedCase.case_id, [memberToRemove]);

      // Remove from selectedVoters
      setSelectedVoters((prev) => prev.filter((id) => id !== memberToRemove));

      showSnackbar('Member removed successfully', 'success');

      // Refresh case data
      fetchCouncilCases();

      handleCloseRemoveModal();
    } catch (error) {
      console.error('Error removing member:', error);
      showSnackbar(error.response?.data?.error || 'Failed to remove member', 'error');
    }
  };

  // Remove all members from case
  const handleRemoveAllMembers = async () => {
    if (!selectedCase) {
      showSnackbar('No case selected', 'warning');
      return;
    }

    try {
      // Get all assigned members for this case
      const existingAssignments = await finalDecisionService.getAssignedMembersForCase(selectedCase.case_id);
      const existingUserIds = existingAssignments.map((a) => a.council_user_id.toString());

      if (existingUserIds.length === 0) {
        showSnackbar('No members to remove', 'info');
        return;
      }

      // Check if any member has already voted
      const hasVoted = existingAssignments.some((a) => a.is_voted);
      if (hasVoted) {
        showSnackbar('Cannot remove members: some members have already voted', 'error');
        return;
      }

      // Remove all members
      await finalDecisionService.removeMembersFromCase(selectedCase.case_id, existingUserIds);

      setSelectedVoters([]);
      showSnackbar('All members removed successfully', 'success');

      // Refresh case data
      fetchCouncilCases();
    } catch (error) {
      console.error('Error removing all members:', error);
      showSnackbar(error.response?.data?.error || 'Failed to remove members', 'error');
    }
  };

  const hasMemberVoted = (memberId) => {
    if (!selectedCase || !selectedCase.assigned_members) return false;
    const member = selectedCase.assigned_members.find((m) => m.id.toString() === memberId.toString());
    return member ? member.voted : false;
  };

  const activeFilter = FILTERS[tabValue] || FILTERS[0];

  const filteredRows = useMemo(() => {
    let filteredData = rows;

    switch (activeFilter.value) {
      case 'pending_voting':
        filteredData = rows.filter((item) => item.final_decision === null && item.pending_count > 0);
        break;
      case 'completed':
        filteredData = rows.filter((item) => item.final_decision !== null);
        break;
      default:
        filteredData = rows;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredData = filteredData.filter(
        (r) =>
          r.judge_name.toLowerCase().includes(q) ||
          r.file_number.toLowerCase().includes(q) ||
          r.court_office.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.applicant_name.toLowerCase().includes(q) ||
          r.case_number.toLowerCase().includes(q)
      );
    }

    return filteredData.map((item, index) => ({
      ...item,
      rowNumber: page * rowsPerPage + index + 1,
    }));
  }, [rows, activeFilter, searchQuery, page, rowsPerPage]);

  useEffect(() => {
    getUserRoleAndPermissions();
    fetchCouncilCases();
  }, []);

  useEffect(() => {
    const availableCaseIds = filteredRows.map((row) => row.case_id);
    setSelectedRows((prev) => prev.filter((id) => availableCaseIds.includes(id)));
    setIsSelectAll(filteredRows.length > 0 && availableCaseIds.length > 0 && availableCaseIds.every((id) => selectedRows.includes(id)));
  }, [filteredRows, selectedRows]);

  // Update selected rows when filtered rows change
  useEffect(() => {
    // Keep only selected rows that are still in filteredRows
    const availableCaseIds = filteredRows.map((row) => row.case_id);
    setSelectedRows((prev) => prev.filter((id) => availableCaseIds.includes(id)));
  }, [filteredRows]);

  const handleViewDetail = (caseId) => {
    navigate('/council_review_detail', { state: { case_id: caseId, userRole: userRole } });
  };

  // Helper function to check any permission
  const checkPermission = (resource, action) => {
    return userPermissions.some((perm) => perm.resource === resource && perm.action === action);
  };

  // Tooltip content for assigned members
  const renderAssignedMembersTooltip = (assignedMembers) => {
    if (!assignedMembers || assignedMembers.length === 0) {
      return 'No members assigned';
    }

    const votedMembers = assignedMembers.filter((m) => m.voted);
    const pendingMembers = assignedMembers.filter((m) => !m.voted);

    return (
      <Box sx={{ minWidth: 250, p: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Assigned Council Members ({assignedMembers.length})
        </Typography>

        {votedMembers.length > 0 && (
          <>
            <Typography variant="caption" color="success.main" fontWeight="bold">
              ✅ Voted ({votedMembers.length})
            </Typography>
            <List dense sx={{ py: 0 }}>
              {votedMembers.map((member) => (
                <ListItem key={member.id} sx={{ py: 0.5, px: 0 }}>
                  <ListItemAvatar sx={{ minWidth: 32 }}>
                    <CheckCircle fontSize="small" color="success" />
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={`Decision: ${member.decision}`}
                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {pendingMembers.length > 0 && (
          <>
            <Typography variant="caption" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'block' }}>
              ⏳ Pending ({pendingMembers.length})
            </Typography>
            <List dense sx={{ py: 0 }}>
              {pendingMembers.map((member) => (
                <ListItem key={member.id} sx={{ py: 0.5, px: 0 }}>
                  <ListItemAvatar sx={{ minWidth: 32 }}>
                    <Pending fontSize="small" color="warning" />
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary="Awaiting decision"
                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    );
  };

  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedRows.includes(row.case_id));
  const someSelected = selectedRows.length > 0 && !allSelected;

  const selectionColumn = canAssignMembers
    ? [
        {
          id: 'selection',
          label: (
            <Checkbox
              indeterminate={someSelected}
              checked={allSelected}
              onChange={handleSelectAll}
              size="small"
            />
          ),
          align: 'center',
          width: '60px',
          render: (row) => (
            <Checkbox
              size="small"
              checked={selectedRows.includes(row.case_id)}
              onChange={() => handleRowSelection(row.case_id)}
              disabled={row.status !== 'assigned to committee'}
            />
          ),
        },
      ]
    : [];

  const columns = useMemo(
    () => [
      ...selectionColumn,
      { id: 'rowNumber', label: 'No.', width: '70px' },
      {
        id: 'case_number',
        label: 'Case Number',
        render: (row) => <Typography sx={{ fontWeight: 600, color: theme.palette.primary.main }}>{row.case_number}</Typography>,
      },
      { id: 'judge_name', label: 'Judge Name', sortable: true },
      { id: 'court_office', label: 'Court Office', sortable: true },
      ...(canAssignMembers
        ? [
            {
              id: 'assign_voters',
              label: 'Assign Voters',
              render: (row) => {
                const { assigned_members } = row;
                const hasMembers = assigned_members && assigned_members.length > 0;

                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={renderAssignedMembersTooltip(assigned_members)} placement="top" arrow enterDelay={300}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenAssignVotersModal('single', row)}
                        sx={{
                          borderRadius: '20px',
                          textTransform: 'none',
                          fontWeight: 500,
                          position: 'relative'
                        }}
                      >
                        {hasMembers ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
                              {assigned_members.slice(0, 3).map((member) => (
                                <Avatar
                                  key={member.id}
                                  sx={{
                                    bgcolor: member.voted ? '#4caf50' : '#ff9800',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {member.name.charAt(0)}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            <Typography variant="body2">{assigned_members.length} assigned</Typography>
                          </Box>
                        ) : (
                          'Assign Members'
                        )}
                      </Button>
                    </Tooltip>

                    {hasMembers && (
                      <Tooltip title="Remove all members">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedCase(row);
                            handleRemoveAllMembers();
                          }}
                          sx={{
                            '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              }
            }
          ]
        : []),
      {
        id: 'status',
        label: 'Case Status',
        render: (row) => {
          const meta = getStatusMeta(theme, row.status);
          return (
            <Chip
              label={meta?.label || row.status}
              size="small"
              sx={{
                backgroundColor: meta?.color || '#0288D1',
                color: 'white',
                fontWeight: 500
              }}
            />
          );
        }
      },
      {
        id: 'action',
        label: 'Action',
        align: 'center',
        render: (row) => (
          <IconButton
            onClick={() => handleViewDetail(row.case_id)}
            sx={{
              color: '#2E3180',
              '&:hover': { backgroundColor: '#e0e0e0' }
            }}
          >
            <Visibility />
          </IconButton>
        )
      }
    ],
    [
      allSelected,
      someSelected,
      canAssignMembers,
      handleOpenAssignVotersModal,
      handleRemoveAllMembers,
      handleRowSelection,
      handleViewDetail,
      selectedRows,
      theme
    ]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.5rem',
            color: theme.palette.primary.main,
            fontFamily: "'Montserrat', sans-serif",
            mb: 0.5
          }}
        >
          Council Review Cases
        </Typography>
        {canAssignMembers && <Chip label="Council Head" color="primary" size="small" variant="outlined" sx={{ mt: 0.5 }} />}
      </Box>

      {/* Filters and Search */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
          width: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          {isMobile ? (
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel id="status-filter-label">Filter</InputLabel>
              <Select
                labelId="status-filter-label"
                value={tabValue}
                label="Filter"
                onChange={(e) => {
                  setTabValue(e.target.value);
                  setPage(0);
                }}
              >
                {FILTERS.map((filter, index) => (
                  <MenuItem key={filter.label} value={index}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => {
                setTabValue(newValue);
                setPage(0);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 36,
                borderRadius: '12px',
                border: '1px solid #E0E0E0',
                backgroundColor: '#FFFFFF',
                p: 0.5,
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              {FILTERS.map((filter, index) => (
                <Tab
                  key={filter.label}
                  label={filter.label}
                  value={index}
                  sx={{
                    textTransform: 'none',
                    minHeight: 36,
                    minWidth: 'auto',
                    px: 2.5,
                    py: 1,
                    mr: 0.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '4px',
                    color: '#666',
                    backgroundColor: '#F7F7FF',
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      color: theme.palette.primary.contrastText,
                      backgroundColor: theme.palette.primary.main,
                    },
                    '&:hover': {
                      backgroundColor: tabValue === index ? theme.palette.primary.main : '#e8e8e8',
                    }
                  }}
                />
              ))}
            </Tabs>
          )}
        </Box>

        <TextField
          size="small"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          sx={{
            minWidth: { xs: '100%', md: 260 },
            backgroundColor: '#f9f9f9',
            borderRadius: '12px',
            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Selection Control Bar */}
      {canAssignMembers && (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={`${selectedRows.length} case(s) selected`} color="primary" variant="outlined" icon={<Assignment />} />
            <Button variant="outlined" size="small" startIcon={<SelectAll />} onClick={handleSelectAll}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearAll />}
              onClick={handleClearSelection}
              disabled={selectedRows.length === 0}
            >
              Clear Selection
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Person />}
              onClick={() => handleOpenAssignVotersModal('multiple')}
              disabled={selectedRows.length === 0}
              sx={{ borderRadius: '20px' }}
            >
              Assign to {selectedRows.length} Case(s)
            </Button>
          </Box>
        </Paper>
      )}

      {/* Filter Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {activeFilter.label} • {filteredRows.length} case(s)
          {selectedRows.length > 0 && ` • ${selectedRows.length} selected`}
        </Typography>
      </Box>

      {/* Data Table */}
      <StandardTable
        columns={columns}
        rows={filteredRows}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredRows.length}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event, value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
        getRowId={(row) => row.case_id}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Assign Voters Modal (Updated for multiple cases) */}
      <Dialog open={assignVotersModalOpen} onClose={handleCloseAssignVotersModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {assignmentMode === 'single' ? 'Manage Council Members' : 'Assign Members to Multiple Cases'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {assignmentMode === 'single'
                  ? selectedCase
                    ? `Case: ${selectedCase.case_number}`
                    : 'Single Case'
                  : `${selectedCasesForAssignment.length} cases selected`}
              </Typography>
            </Box>
            {assignmentMode === 'single' && selectedCase && (
              <Chip label={`Case: ${selectedCase.case_number}`} color="primary" variant="outlined" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {assignmentMode === 'multiple' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You are assigning members to {selectedCasesForAssignment.length} cases. The same council members will be assigned to all
              selected cases.
            </Alert>
          )}

          {assignmentMode === 'single' && selectedCase && (
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              Currently assigned: <strong>{selectedCase.assigned_members?.length || 0}</strong> members
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                select
                label="Select Council Members"
                value={selectedVoters}
                onChange={(e) => setSelectedVoters(e.target.value)}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 100, overflow: 'auto' }}>
                      {selected.map((value) => {
                        const user = allUsers.find((u) => u.user_id.toString() === value.toString());
                        return (
                          <Chip
                            key={value}
                            label={hasMemberVoted(value) ? `${user?.full_name} (Voted)` : user?.full_name}
                            size="small"
                            onDelete={hasMemberVoted(value) ? undefined : () => handleOpenRemoveModal(value)}
                            deleteIcon={hasMemberVoted(value) ? null : <Delete />}
                            sx={{
                              opacity: hasMemberVoted(value) ? 0.6 : 1,
                              pointerEvents: hasMemberVoted(value) ? 'none' : 'auto'
                            }}
                          />
                        );
                      })}
                    </Box>
                  )
                }}
                fullWidth
                sx={{ mt: 1 }}
              >
                {allUsers.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                          {user.full_name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography>{user.full_name}</Typography>
                        </Box>
                      </Box>
                      {selectedVoters.includes(user.user_id.toString()) && <CheckCircle color="success" fontSize="small" />}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {selectedVoters.length} member(s) selected
                </Typography>
                {assignmentMode === 'single' && selectedVoters.length > 0 && (
                  <Button size="small" color="error" startIcon={<Delete />} onClick={handleRemoveAllMembers}>
                    Remove All
                  </Button>
                )}
              </Box>
            </Box>

            {/* Current Members Preview */}
            <Box sx={{ flex: 1, borderLeft: 1, borderColor: 'divider', pl: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {assignmentMode === 'single' ? 'Current Assignment Preview' : 'Selected Cases'}
              </Typography>

              {assignmentMode === 'multiple' ? (
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedCasesForAssignment.map((caseData, index) => (
                    <ListItem key={caseData.case_id} dense>
                      <ListItemText
                        primary={`${index + 1}: ${caseData.case_number}`}
                        secondary={`${caseData.assigned_members?.length || 0} members assigned`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : selectedVoters.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No members selected
                </Typography>
              ) : (
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedVoters.map((userId) => {
                    const user = allUsers.find((u) => u.user_id.toString() === userId);
                    return user ? (
                      <ListItem
                        key={userId}
                        secondaryAction={
                          hasMemberVoted(userId) ? (
                            <Chip label="Voted" color="success" size="small" />
                          ) : (
                            <IconButton edge="end" size="small" onClick={() => handleOpenRemoveModal(userId)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>{user.full_name?.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={user.full_name} secondary={user.department_name} />
                      </ListItem>
                    ) : null;
                  })}
                </List>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Box>
            {assignmentMode === 'single' && selectedCase?.assigned_members?.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Currently: {selectedCase.assigned_members.length} members assigned
              </Typography>
            )}
            {assignmentMode === 'multiple' && (
              <Typography variant="caption" color="text.secondary">
                {selectedCasesForAssignment.length} cases selected
              </Typography>
            )}
          </Box>
          <Box>
            <Button onClick={handleCloseAssignVotersModal} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleAssignVoters} variant="contained" disabled={selectedVoters.length === 0} sx={{ ml: 1 }}>
              {assignmentMode === 'single' ? 'Save Changes' : `Assign to ${selectedCasesForAssignment.length} Cases`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Remove Member Confirmation Modal */}
      <Dialog open={removeModalOpen} onClose={handleCloseRemoveModal}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          {memberToRemove && <Typography>Are you sure you want to remove this council member from the case?</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveModal} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleRemoveMember} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
