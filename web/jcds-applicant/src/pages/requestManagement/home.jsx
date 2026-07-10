import { useLoading } from "@/loading-context";
import { Button, Card, Typography, Spinner } from "@material-tailwind/react";
import { 
  ScaleIcon, 
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  Document,
  Font,
  Image,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { createCanvas } from "canvas";
import QRCode from "qrcode";
import React from "react";
import { createPortal } from "react-dom";

import customerAuthService from "@/service/customer-auth.service";
import complaintService from "@/service/complaint.service";
import StatisticsCardHome from "@/widgets/cards/statistics-card-home";
import DisciplinaryCard2 from "@/widgets/cards/disciplinary-card2";
import ComplaintCardHome from "@/widgets/cards/complaint-card-home";
import ComplaintCard2 from "@/widgets/cards/complaint-card2";
import DisciplinaryCard3 from "@/widgets/cards/disciplinary-card3";
import ComplaintCard3 from "@/widgets/cards/complaint-card3";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ClockIcon,
  InboxIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import {
  default as RequestService,
  default as requestService,
} from "../../service/request.service";
import ConfirmDialog from "./delete-modal";
import LoadingPage from "./loading-page";
import NewRequestModal from "../newRequest/newRequest-modal";

export function Home() {
  const { t } = useTranslation();
  Font.register({
    family: "AbyssinicaSIL",
    src: "https://fonts.gstatic.com/s/abyssinicasil/v5/oY1H8ezOqK7iI3rK_45WKoc8J6UZBFOVAXuI.ttf",
  });

  Font.register({
    family: "NotoSansEthiopic",
    src: "https://fonts.gstatic.com/s/notosansethiopic/v18/7cHPv50vjIepfJVOZZgcpQ5B9FBTH9KGNfhSTgtoow.ttf",
  });

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const customerAccountToken = localStorage.getItem("customerAccountToken");
  const [userProfile, setUserProfile] = useState(null);
  const itemsPerPageOptions = [8, 16, 32, 50, 100];
  const [requestsData, setRequestsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [totalPages, setTotalPages] = useState();

  const [filter, setFilter] = useState("all");
  const [documents, setDocuments] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [requestId, setRequestId] = useState();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0]);
  const [allRequestsCount, setAllRequestsCount] = useState(0);
  const [totalRequestsCount, setTotalRequestsCount] = useState(0); // Total count regardless of filter
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [underReviewRequestsCount, setUnderReviewRequestsCount] = useState(0);
  const [underCouncilReviewRequestsCount, setUnderCouncilReviewRequestsCount] =
    useState(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState(0);
  const [decidedRequestsCount, setDecidedRequestsCount] = useState(0);
  const [rejectedRequestsCount, setRejectedRequestsCount] = useState(0);
  const [returnedRequestsCount, setReturnedRequestsCount] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestType, setRequestType] = useState(() => {
    // Initialize from localStorage, default to "disciplinary" on first login
    const storedRequestType = localStorage.getItem("lastRequestType");
    return storedRequestType || "disciplinary";
  });
  const [hasAnyRequests, setHasAnyRequests] = useState(false); // Track if user has any requests at all
  const processedStateKeyRef = useRef(null); // Track the last processed state key to avoid re-processing

  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandLoadingState, setExpandLoadingState] = useState({});
  const [selectedRequestData, setSelectedRequestData] = useState();
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const createButtonRef = useRef(null);
  const handleFilterChange = (filterType) => {
    startLoading();
    setTimeout(() => {
      setFilter(filterType);
      updateURL(filterType, sortOrder, searchQuery, itemsPerPage, currentPage);
      stopLoading();
    }, 500);
  };

  // Map frontend filter to backend status
  const mapFilterToStatus = (filter) => {
    const statusMap = {
      all: null,
      Pending: "pending",
      "Under Investigation": "under_investigation",
      "Under Council Review": "under_council_review",
      Approved: "accepted",
      Decided: "Decided",
      Rejected: "rejected",
      Returned: "returned",
    };
    return statusMap[filter] || null;
  };

  const handleRequestTypeChange = (type) => {
    if (type === requestType) {
      return;
    }
    // Use the card-level loading state instead of global loader
    setCardsLoading(true);
    setRequestType(type);
    setRequestsData([]);
    // Save to localStorage for persistence
    localStorage.setItem("lastRequestType", type);
    setCurrentPage(1);
    setFilter("all");
    // Reset counts when switching types
    setAllRequestsCount(0);
    setTotalRequestsCount(0);
    setPendingRequestsCount(0);
    setUnderReviewRequestsCount(0);
    setUnderCouncilReviewRequestsCount(0);
    setApprovedRequestsCount(0);
    setDecidedRequestsCount(0);
    setRejectedRequestsCount(0);
    setReturnedRequestsCount(0);
  };

  const handleDisciplineRequest = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      startLoading();
      // navigate("/home/disciplinary-request");
      navigate("/home/disciplinary-request-v3", { replace: false });
      setTimeout(() => {
        stopLoading();
      }, 300);
    } catch (error) {
      console.error("Navigation error:", error);
      stopLoading();
      // Fallback to window location
      window.location.href = "/home/disciplinary-request-v3";
    }
  };
  const handleComplaintRequest = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      startLoading();
      // navigate("/home/complaint-request");
      navigate("/home/complaint-request-v3", { replace: false });
      setTimeout(() => {
        stopLoading();
      }, 300);
    } catch (error) {
      console.error("Navigation error:", error);
      stopLoading();
      // Fallback to window location
      window.location.href = "/home/complaint-request-v3";
    }
  };

  const handleCreateRequest = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Create Request button clicked, showing modal");
    setShowNewRequestModal(true);
  };

  const handleDeleteNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 1000);
  };

  const handleDeleteClick = (e, request_id) => {
    e.stopPropagation();
    setRequestId(request_id);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenConfirmDialog(false);
    startLoading();
    try {
      const response = await requestService.deleteRequest(requestId);
      if (response.status === 204) {
        toast.success("Request deleted successfully", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        toast.error("Failed to delete request", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#ffffff",
            color: "#ef4444",
            border: "none",
            borderBottom: "1px solid #ef4444",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            zIndex: 9999999999,
          },
        });
        handleDeleteNavigation("/home/requests");
      }
    } catch (error) {
      toast.error("Error deleting request", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#ef4444",
          border: "none",
          borderBottom: "1px solid #ef4444",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          zIndex: 9999999999,
        },
      });
      handleDeleteNavigation("/home/requests");
      console.error(error);
    } finally {
      stopLoading();
    }
  };

  const updateURL = (
    newFilter,
    newSort,
    newSearch,
    newItemsPerPage,
    newPage
  ) => {
    const params = new URLSearchParams();
    if (newFilter) params.set("filter", newFilter);
    if (newSort) params.set("sort", newSort);
    if (newSearch !== undefined) params.set("search", newSearch);
    if (newItemsPerPage !== undefined)
      params.set("itemsPerPage", newItemsPerPage);
    if (newPage !== undefined) params.set("page", newPage);
    navigate(`?${params.toString()}`);
  };

  const handleCloseDialog = () => {
    setOpenConfirmDialog(false);
  };

  const sortData = (data, sortOrder) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.request_date);
      const dateB = new Date(b.request_date);

      if (sortOrder === "desc") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  };

  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = Number(event.target.value);
    startLoading();
    setTimeout(() => {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1);
      updateURL(filter, sortOrder, searchQuery, newItemsPerPage, 1);

      stopLoading();
    }, 500);
  };

  const handleDocumentSelect = (selectedDocument, documentName) => {
    setSelectedDocument(selectedDocument);
    setSelectedDocumentName(documentName);
  };
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    updateURL(filter, sortOrder, searchQuery, itemsPerPage, newPage);
  };

  // Reset processed state key when pathname changes (new navigation)
  useEffect(() => {
    processedStateKeyRef.current = null;
  }, [location.pathname]);

  // Check for success snack from navigation state and set request type
  useEffect(() => {
    // Create a stable key for this state based on its content
    const stateKey = location.state?.showSuccessSnack 
      ? `${location.state.successMessage || ''}-${location.state.requestType || ''}`
      : null;
    
    // Only process state if it exists and we haven't processed this specific state yet
    if (location.state?.showSuccessSnack && processedStateKeyRef.current !== stateKey) {
      const message = location.state.successMessage || "Complaint is submitted successfully";
      
      // Show toast immediately
      toast.success(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#10b981",
          border: "none",
          borderBottom: "1px solid #10b981",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          zIndex: 9999999999,
        },
        className: "toast-success-custom",
      });
      
      // Set request type if provided in navigation state
      if (location.state?.requestType) {
        setRequestType(location.state.requestType);
        localStorage.setItem("lastRequestType", location.state.requestType);
      }
      
      // Mark this state as processed
      processedStateKeyRef.current = stateKey;
      
      // Clear the state after a short delay to ensure toast is shown
      setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 100);
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const cleanURL = () => {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);

      params.delete("filter");
      params.delete("sort");
      params.delete("search");
      params.delete("itemsPerPage");
      params.delete("page");

      window.history.replaceState(
        {},
        document.title,
        `${url.pathname}${params.toString()}`
      );
    };

    cleanURL();
  }, []);

  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    const urlSort = searchParams.get("sort");
    const urlSearch = searchParams.get("search");
    const urlItemsPerPage = searchParams.get("itemsPerPage");
    const urlCurrentPage = searchParams.get("page");

    if (
      urlFilter &&
      ["all", "pending", "approved", "rejected"].includes(urlFilter)
    ) {
      setFilter(urlFilter);
    }
    if (urlSort && ["asc", "desc"].includes(urlSort)) {
      setSortOrder(urlSort);
    }
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
    if (
      urlItemsPerPage &&
      itemsPerPageOptions.includes(Number(urlItemsPerPage))
    ) {
      setItemsPerPage(Number(urlItemsPerPage));
    }
    if (urlCurrentPage && !isNaN(urlCurrentPage)) {
      setCurrentPage(Number(urlCurrentPage));
    }
  }, [searchParams]);

  useEffect(() => {
    if (customerAccountToken) {
      const decodedToken = jwtDecode(customerAccountToken);
      const userId = decodedToken.id;

      const fetchUserProfile = async () => {
        try {
          const response = await customerAuthService.getCustomerById(userId);
          setUserProfile(response.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    } else {
      console.log("No token found");
    }
  }, [customerAccountToken]);

  // Initialize request type from localStorage on component mount
  useEffect(() => {
    const storedRequestType = localStorage.getItem("lastRequestType");
    if (storedRequestType && storedRequestType !== requestType) {
      setRequestType(storedRequestType);
    }
  }, []);

  const fetchRequestsData = async () => {
    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      } else {
        setCardsLoading(true);
      }
      const token = localStorage.getItem("customerAccountToken");
      if (!token) {
        toast.error("User is not logged in", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
          style: {
            backgroundColor: "#ffffff",
            color: "#ef4444",
            border: "none",
            borderBottom: "1px solid #ef4444",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            zIndex: 9999999999,
          },
        });
        return;
      }

      const decodedToken = jwtDecode(token);
      const customerId = decodedToken.id;

      // Fetch both disciplinary and complaint data simultaneously using Promise.all
      const [
        disciplinaryAllData,
        complaintAllData,
        disciplinaryData,
        complaintData,
      ] = await Promise.all([
        // Get all disciplinary data for counts
        RequestService.getDisciplinaryRequestsByCustomerId(customerId, {
          filter: null,
          sortOrder,
          page: 1,
          limit: 1000,
        }),
        // Get all complaint data for counts
        RequestService.getComplaintRequestsByCustomerId(customerId, {
          filter: null,
          sortOrder,
          page: 1,
          limit: 1000,
        }),
        // Get filtered disciplinary data for display
        RequestService.getDisciplinaryRequestsByCustomerId(customerId, {
          filter: mapFilterToStatus(filter),
          sortOrder,
          page: currentPage,
          limit: itemsPerPage,
        }),
        // Get filtered complaint data for display
        RequestService.getComplaintRequestsByCustomerId(customerId, {
          filter: mapFilterToStatus(filter),
          sortOrder,
          page: currentPage,
          limit: itemsPerPage,
        }),
      ]);

      // Check if user has any requests at all (either disciplinary or complaint)
      const disciplinaryTotalCount =
        disciplinaryAllData.discliplinary_complaints?.length || 0;
      const complaintTotalCount = complaintAllData.data?.length || 0;
      const totalUserRequests = disciplinaryTotalCount + complaintTotalCount;

      console.log("Promise.all Results:", {
        disciplinaryTotalCount,
        complaintTotalCount,
        totalUserRequests,
        hasAnyRequests: totalUserRequests > 0,
      });

      setHasAnyRequests(totalUserRequests > 0);

      // Determine which data to use based on requestType
      const allData =
        requestType === "disciplinary" ? disciplinaryAllData : complaintAllData;
      const data =
        requestType === "disciplinary" ? disciplinaryData : complaintData;

      // Map backend response to frontend format based on request type
      let mappedRequests = [];

      if (requestType === "disciplinary") {
        // Map disciplinary data structure
        mappedRequests =
          data.discliplinary_complaints?.map((disciplinary) => {
            return {
              request_id: disciplinary.disciplinary_complaint_id,
              applicantNames: disciplinary.applicant?.full_name || "N/A",
              applicantRegions: "N/A", // Not available in backend response
              applicantZones: "N/A", // Not available in backend response
              applicantWoredas: "N/A", // Not available in backend response
              applicantPhoneNumber: "N/A", // Not available in backend response
              applicantCity: "N/A", // Not available in backend response
              applicantSubCity: "N/A", // Not available in backend response
              status: disciplinary.status,
              representative_name: "N/A", // Not available in backend response
              respondentNames: disciplinary.judge_name || "N/A",
              request_date: disciplinary.createdAt,
              judge_name: disciplinary.judge_name,
              court_office: disciplinary.court_office,
              file_number: disciplinary.file_number,
              signature_url: disciplinary.signature_url,
              issues: disciplinary.issues || [],
              evidences: disciplinary.evidences || [],
              icon: ScaleIcon, // Use ScaleIcon for disciplinary requests
              archives: disciplinary.evidences?.length || 0,
              documents: disciplinary.evidences || [],
              documentStatusCount: {
                approved: 0,
                pending: disciplinary.evidences?.length || 0,
                rejected: 0,
              },
            };
          }) || [];
      } else {
        // Map complaint data structure
        mappedRequests =
          data.data?.map((complaint) => {
            return {
              request_id: complaint.complaint_id,
              applicantNames: complaint.applicant?.full_name || "N/A",
              applicantRegions: "N/A", // Not available in backend response
              applicantZones: "N/A", // Not available in backend response
              applicantWoredas: "N/A", // Not available in backend response
              applicantPhoneNumber: complaint.applicant?.phone_number || "N/A",
              applicantCity: "N/A", // Not available in backend response
              applicantSubCity: "N/A", // Not available in backend response
              status: complaint.status,
              representative_name: "N/A", // Not available in backend response
              respondentNames: complaint.judge_name || "N/A",
              request_date: complaint.created_at,
              judge_name: complaint.judge_name,
              judge_court: complaint.judge_court,
              case_file_number: complaint.case_file_number,
              case_type: complaint.case_type,
              act_date: complaint.act_date,
              submission_date: complaint.submission_date,
              evidences: complaint.evidences || [],
              witnesses: complaint.witnesses || [],
              icon: ExclamationTriangleIcon, // Use ExclamationTriangleIcon for complaint requests
              archives: complaint.evidences?.length || 0,
              documents: complaint.evidences || [],
              documentStatusCount: {
                approved: 0,
                pending: complaint.evidences?.length || 0,
                rejected: 0,
              },
            };
          }) || [];
      }

      const requestsWithDocuments = await Promise.all(
        mappedRequests.map(async (request) => {
          // For disciplinary requests, we already have the documents from evidences
          return {
            ...request,
            documents: request.documents,
            documentStatusCount: request.documentStatusCount,
          };
        })
      );

      setRequestsData(requestsWithDocuments);

      // Calculate counts based on ALL data (for accurate totals) - handle both data structures
      let totalCount,
        pendingCount,
        underReviewCount,
        underCouncilReviewCount,
        approvedCount,
        decidedCount,
        rejectedCount,
        returnedCount,
        filteredCount;

      if (requestType === "disciplinary") {
        // Disciplinary data structure
        totalCount = allData.discliplinary_complaints?.length || 0;
        pendingCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "pending"
          ).length || 0;
        underReviewCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "under_investigation"
          ).length || 0;
        underCouncilReviewCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "under_council_review"
          ).length || 0;
        approvedCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "accepted"
          ).length || 0;
        decidedCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "Decided"
          ).length || 0;
        rejectedCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "rejected"
          ).length || 0;
        returnedCount =
          allData.discliplinary_complaints?.filter(
            (c) => c.status === "returned"
          ).length || 0;

        // Calculate filtered count for current display
        filteredCount = data.discliplinary_complaints?.length || 0;
      } else {
        // Complaint data structure
        totalCount = allData.data?.length || 0;
        pendingCount =
          allData.data?.filter((c) => c.status === "pending").length || 0;
        underReviewCount =
          allData.data?.filter((c) => c.status === "under_investigation")
            .length || 0;
        underCouncilReviewCount =
          allData.data?.filter((c) => c.status === "under_council_review")
            .length || 0;
        approvedCount =
          allData.data?.filter((c) => c.status === "accepted").length || 0;
        decidedCount =
          allData.data?.filter((c) => c.status === "Decided").length || 0;
        rejectedCount =
          allData.data?.filter((c) => c.status === "rejected").length || 0;
        returnedCount =
          allData.data?.filter((c) => c.status === "returned").length || 0;

        // Calculate filtered count for current display
        filteredCount = data.data?.length || 0;
      }

      setAllRequestsCount(filteredCount); // Current filtered count
      setTotalRequestsCount(totalCount); // Total count regardless of filter
      setPendingRequestsCount(pendingCount);
      setUnderReviewRequestsCount(underReviewCount);
      setUnderCouncilReviewRequestsCount(underCouncilReviewCount);
      setTotalPages(data.pagination?.totalPages || 1);
      setApprovedRequestsCount(approvedCount);
      setDecidedRequestsCount(decidedCount);
      setRejectedRequestsCount(rejectedCount);
      setReturnedRequestsCount(returnedCount);
    } catch (error) {
      console.error("Error fetching request data:", error);
    } finally {
      setLoading(false);
      setCardsLoading(false);
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }
  };

  const handleNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 100);
  };

  const handleDelete = async (requestId) => {
    try {
      startLoading();

      // Delete the complaint from backend
      if (requestType === "complaint") {
        await complaintService.deleteComplaint(requestId);
      } else {
        await requestService.deleteRequest(requestId);
      }

      // Update local state to remove the deleted item
      setRequestsData((prevRequests) =>
        prevRequests.filter((request) => request.request_id !== requestId)
      );

      // Update counts
      setAllRequestsCount((prev) => prev - 1);
      setTotalRequestsCount((prev) => prev - 1);

      toast.success("Request deleted successfully");
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#ef4444",
          border: "none",
          borderBottom: "1px solid #ef4444",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          zIndex: 9999999999,
        },
      });
      // Refetch data to ensure consistency
      await fetchRequestsData();
    } finally {
      stopLoading();
    }
  };
  const fetchDocuments = async (request_id) => {
    try {
      const response = await requestService.getRequestDocuments(request_id);
      setDocuments(response.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };
  const handleExpandToggle = (expanded, id, selectedRequestData) => {
    setExpandLoadingState((prevState) => ({
      ...prevState,
      [id]: true,
    }));

    const shortId = id.slice(0, 8);

    setTimeout(() => {
      setIsExpanded(expanded);
      setExpandLoadingState((prevState) => ({
        ...prevState,
        [id]: false,
      }));
      if (expanded) {
        navigate(`/home/request-details/${shortId}`, {
          state: {
            expanded,
            id: shortId,
            selectedRequestData,
          },
        });
      }
    }, 1000);
  };
  const fetchDocumentStatusCount = async (request_id) => {
    try {
      const response =
        await requestService.getRequestDocumentStatusCount(request_id);

      const { approved, pending, rejected } = response;

      return { approved, pending, rejected };
    } catch (error) {
      console.error("Error fetching document status count:", error);
      return {
        status: "error",
        message: "Unable to fetch document status counts",
        approved: -1,
        pending: -1,
        rejected: -1,
      };
    }
  };

  // const handleSortChange = () => {
  //   startLoading();
  //   setTimeout(() => {
  //     const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
  //     setSortOrder(newSortOrder);
  //     updateURL(filter, newSortOrder, searchQuery, itemsPerPage, currentPage);
  //     stopLoading();
  //   }, 500);
  // };

  // const handleSearchChange = (event) => {
  //   const newSearchQuery = event.target.value;
  //   setSearchQuery(newSearchQuery);
  //   updateURL(filter, sortOrder, newSearchQuery, itemsPerPage, currentPage);
  // };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRequestsData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filter, sortOrder, currentPage, itemsPerPage, searchQuery, requestType]);

  // Redirect to landing page if user has no requests
  useEffect(() => {
    if (!loading && !hasAnyRequests) {
      navigate("/home/landing", { replace: true });
    }
  }, [loading, hasAnyRequests, navigate]);

  const sortedRequests = sortData(requestsData, sortOrder);

  const logo = "/jcdms-applicant/img/Courts-logo.png";

  const handlePrint = async (request_id) => {
    startLoading();
    try {
      const response = await requestService.getRequestById(request_id);
      if (response) {
        const applicant = response.applicants?.[0] || {};
        const respondent = response.respondents?.[0] || {};

        const formattedRequestId = `#${request_id.toString().slice(0, 8)}`;

        const data = {
          request_id: formattedRequestId,
          applicantName:
            applicant.applicant_name || response.data?.applicantNames || "N/A",
          status: response.status || "N/A",
          requestDate: response.request_date
            ? format(new Date(response.request_date), "MMMM dd, yyyy")
            : "N/A",
          region: applicant.region?.name || response.applicantRegions || "N/A",
          zone: applicant.zone?.name || response.applicantZones || "N/A",
          city: applicant.city?.name || response.applicantCity || "N/A",
          subCity:
            applicant.subcity?.name || response.applicantSubCity || "N/A",
          woreda: applicant.woreda?.name || response.applicantWoredas || "N/A",
          representative: response.representative_name || "N/A",
          respondentName:
            respondent.respondent_name || response.respondentNames || "N/A",
          affairDescription: response.affair_description || "N/A",
          caseType: response.caseType?.name || response.caseTypeName || "N/A",
          constitutionalComplaint:
            response.constitutional_complaint_summary || "N/A",
          phoneNumber: applicant.phone_number || response.phone_number || "N/A",
          respondentRegion:
            respondent.region?.name || response.respondentRegions || "N/A",
          respondentZone:
            respondent.zone?.name || response.respondentZones || "N/A",
          respondentCity:
            respondent.city?.name || response.respondentCities || "N/A",
          respondentSubCity:
            respondent.subcity?.name || response.respondentSubCities || "N/A",
          respondentWoreda:
            respondent.woreda?.name || response.respondentWoredas || "N/A",
          respondentPhone:
            respondent.respondentPhoneNumber ||
            response.respondentPhoneNumber ||
            "N/A",
          respondentAddress:
            respondent.respondentAddress || response.respondentAddress || "N/A",
        };
        const qrCodeUrl = await generateQRCode(data.request_id);

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <html>
            <head>
              <title>CCI - Request Details - ${formattedRequestId}</title>
              <style>
                body {
                  font-family: 'Times New Roman', Times, serif;
                  line-height: 1.2;
                  margin: 0.5in;
                  color: #1a202c;
                  font-size: 10pt;
                  background: #fff;
                }
                .container {
                  max-width: 7.5in;
                  margin: 0 auto;
                }
                .header-container {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 20px;
                  border-bottom: 1px solid #4169a5;
                  padding-bottom: 10px;
                }
                .header-text {
                  color: #4169a5;
                  white-space: pre-line;
                  text-align: center;
                  font-weight: bold;
                  font-size: 16px;
                  min-width: 120px;
                }
                .header-text:first-child {
                  text-align: center;
                }
                .header-text:last-child {
                  text-align: center;
                  font-family: 'Times New Roman', Times, serif;
                }
                .header-logo {
                  width: 140px;
                  margin: 0 auto;
                }
                h1 {
                  color: #1a365d;
                  font-size: 14pt;
                  text-align: center;
                  margin: 10px 0;
                  border-bottom: 1px solid #e2e8f0;
                  padding-bottom: 5px;
                }
                h2 {
                  color: #2c5282;
                  font-size: 11pt;
                  margin: 8px 0 4px;
                  border-left: 3px solid #2b6cb0;
                  padding-left: 6px;
                }
                .section {
                  margin-bottom: 8px;
                  padding: 6px;
                  border: 1px solid #e2e8f0;
                  border-radius: 4px;
                }
                .label {
                  font-weight: bold;
                  display: inline-block;
                  width: 100px;
                  color: #2d3748;
                }
                p {
                  margin: 2px 0;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .qr-code {
                  margin: 6px 0;
                  text-align: center;
                  padding: 4px;
                  border: 1px solid #e2e8f0;
                  border-radius: 3px;
                  display: inline-block;
                }
                .print-button {
                  display: block;
                  margin: 8px auto;
                  padding: 5px 10px;
                  background: #2b6cb0;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  cursor: pointer;
                  font-size: 9pt;
                }
                .print-button:hover {
                  background: #3182ce;
                }
                .row {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 10px;
                }
                .col {
                  flex: 1;
                  min-width: 160px;
                }
                .header {
                  text-align: center;
                  margin-top: 30px;
                  margin-bottom: 10px;
                  font-size: 9pt;
                  color: #4a5568;
                }
                .footer {
                  text-align: center;
                  margin-top: 10px;
                  font-size: 8pt;
                  color: #718096;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 5px;
                }
                  main.content {
                    flex: 1;
                  }

                  .custom-footer {
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    margin-top: auto;
                  }

                  .footer-grid {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    border-top: 2px solid #fcce03;
                    margin-top: 20px;
                    font-size: 10pt;
                  }

                  .footer-column {
                    flex: 1;
                    padding: 6px;
                  }

                  .border-right {
                    border-right: 2px solid #fcce03;
                  }

                  .footer-text {
                    font-weight: bold;
                    color: #4169a5;
                    font-family: "AbyssinicaSIL", "Times New Roman", serif;
                    font-size: 6pt;
                    margin: 0;
                  }

                  .center-text {
                    text-align: center;
                  }
                       
                @media print {
                  body {
                    margin: 0.25in;
                  }
                  .section {
                    border: none;
                    padding: 4px;
                  }
                  .no-print {
                    display: none;
                  }
                  .qr-code {
                    border: 1px solid #000;
                  }
                  .container {
                    max-width: none;
                  }
                  .header-container {
                    border-bottom: 2px solid #4169a5;
                  }
                    .custom-footer {
                      position: absolute;
                      bottom: 20px;
                      left: 20px;
                      right: 20px;
                      margin-top: auto;
                    }

                    .footer-grid {
                      display: flex;
                      flex-direction: row;
                      justify-content: space-between;
                      border-top: 2px solid #fcce03;
                      margin-top: 20px;
                      font-size: 10pt;
                    }

                    .footer-column {
                      flex: 1;
                      padding: 6px;
                    }

                    .border-right {
                      border-right: 2px solid #fcce03;
                    }

                    .footer-text {
                      font-weight: bold;
                      color: #4169a5;
                      font-family: "AbyssinicaSIL", "Times New Roman", serif;
                      font-size: 7pt;
                      margin: 0;
                    }

                    .center-text {
                      text-align: center;
                    }
                    
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header-container">
                  <div class="header-text" style="line-height: 0.7;">
                    የፌደራል ዳኞች አስተዳደር ጉባኤ ጽ/ቤት
                  </div>
                  <img src="${logo}" alt="Company Logo" class="header-logo"/>
                  <div class="header-text"  style="font-family: 'Times New Roman', Times, serif;line-height: 0.7;">
                    FEDERAL JUDICIAL ADMINISTRATION COUNCIL SECRETARIAT 
                  </div>
                </div>
                
                <div class="header">
                  <p>Judiciary Complaint Management System - Generated on ${format(
                    new Date(),
                    "MMMM dd, yyyy"
                  )}</p>
                </div>
                <h1>Request Details</h1>
                <div class="row">
                  <div class="col">
                    <div class="section">
                      <h2>Basic Information</h2>
                      <p><span class="label">Request ID:</span> ${
                        data.request_id
                      }</p>
                      <div class="qr-code">
                        <img src="${qrCodeUrl}" alt="QR Code" style="width:70px;height:70px;"/>
                      </div>
                      <p><span class="label">Status:</span> ${data.status}</p>
                      <p><span class="label">Request Date:</span> ${
                        data.requestDate
                      }</p>
                    </div>
                    <div class="section">
                      <h2>Request Details</h2>
                      <p><span class="label">Case Type:</span> ${
                        data.caseType
                      }</p>
                      <p><span class="label">Affair Desc:</span> ${data.affairDescription.substring(
                        0,
                        35
                      )}${data.affairDescription.length > 35 ? "..." : ""}</p>
                      <p><span class="label">Complaint:</span> ${data.constitutionalComplaint.substring(
                        0,
                        35
                      )}${
                        data.constitutionalComplaint.length > 35 ? "..." : ""
                      }</p>
                    </div>
                  </div>
                  <div class="col">
                    <div class="section">
                      <h2>Applicant Information</h2>
                      <p><span class="label">Name:</span> ${
                        data.applicantName
                      }</p>
                      ${
                        data.region !== "N/A"
                          ? `<p><span class="label">Region:</span> ${data.region}</p>`
                          : ""
                      }
                      ${
                        data.zone !== "N/A"
                          ? `<p><span class="label">Zone:</span> ${data.zone}</p>`
                          : ""
                      }
                      ${
                        data.city !== "N/A"
                          ? `<p><span class="label">City:</span> ${data.city}</p>`
                          : ""
                      }
                      ${
                        data.subCity !== "N/A"
                          ? `<p><span class="label">Sub-city:</span> ${data.subCity}</p>`
                          : ""
                      }
                      <p><span class="label">Woreda:</span> ${data.woreda}</p>
                      <p><span class="label">Phone:</span> ${
                        data.phoneNumber
                      }</p>
                      ${
                        data.representative !== "N/A"
                          ? `<p><span class="label">Representative:</span> ${data.representative}</p>`
                          : ""
                      }
                    </div>
                    <div class="section">
                      <h2>Respondent Information</h2>
                      ${
                        data.respondentName !== "N/A"
                          ? `<p><span class="label">Name:</span> ${data.respondentName}</p>`
                          : ""
                      }
                      ${
                        data.respondentRegion !== "N/A"
                          ? `<p><span class="label">Region:</span> ${data.respondentRegion}</p>`
                          : ""
                      }
                      ${
                        data.respondentZone !== "N/A"
                          ? `<p><span class="label">Zone:</span> ${data.respondentZone}</p>`
                          : ""
                      }
                      ${
                        data.respondentCity !== "N/A"
                          ? `<p><span class="label">City:</span> ${data.respondentCity}</p>`
                          : ""
                      }
                      ${
                        data.respondentSubCity !== "N/A"
                          ? `<p><span class="label">Sub-city:</span> ${data.respondentSubCity}</p>`
                          : ""
                      }
                      ${
                        data.respondentWoreda !== "N/A"
                          ? `<p><span class="label">Woreda:</span> ${data.respondentWoreda}</p>`
                          : ""
                      }
                      ${
                        data.respondentPhone !== "N/A"
                          ? `<p><span class="label">Phone:</span> ${data.respondentPhone}</p>`
                          : ""
                      }
                      ${
                        data.respondentAddress !== "N/A"
                          ? `<p><span class="label">Address:</span> ${data.respondentAddress}</p>`
                          : ""
                      }
                      
                    </div>
                  </div>
                </div>
                <div class="footer">
                  <p>FEDERAL JUDICIAL ADMINISTRATION COUNCIL SECRETARIAT</p>
                  <p>Contact: fjacouncil@gmail.com | Judiciary Complaint Management System</p>
                </div>
                

                <button class="print-button no-print" onclick="window.print()">Print Document</button>
                <footer class="custom-footer">
                  <div class="footer-grid">
                    <div class="footer-column border-right">
                      <div class="footer-text">
                        ስልክ/Tel: +251-11-1-54-29-76<br />
                        : +251-11-1-54-18-99<br />
                      </div>
                    </div>
                    <div class="footer-column border-right center-text">
                      <div class="footer-text">
                        ፋክስ/Fax: +251 11-173-30 29<br />
                        ፓ.ሳ.ቁ/P.O.Box: 6166<br />
                        አዲስ አበባ<br />
                        Addis Ababa
                      </div>
                    </div>
                    <div class="footer-column center-text">
                      <div class="footer-text">
                        ኢ-ሜይል/E-mail: fjacouncil@gmail.com<br />
                        ድረ-ገፅ/Website: www.fjacs.gov.et/<br />
                      </div>
                    </div>
                  </div>
                </footer>



              </div>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
              <script>
                document.addEventListener('DOMContentLoaded', () => {
                  setTimeout(() => {
                    try {
                      const qrCanvas = document.getElementById('qrCode');
                      if (qrCanvas) {
                        new QRCode(qrCanvas, {
                          text: '${formattedRequestId}',
                          width: 70,
                          height: 70,
                          colorDark: '#000000',
                          colorLight: '#ffffff',
                          correctLevel: QRCode.CorrectLevel.H
                        });
                      } else {
                        console.error('QR code canvas not found');
                      }
                    } catch (error) {
                      console.error('Error generating QR code:', error);
                    }
                  }, 100);
                });
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        toast.error("Failed to fetch request details", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#ffffff",
            color: "#ef4444",
            border: "none",
            borderBottom: "1px solid #ef4444",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            zIndex: 9999999999,
          },
        });
      }
    } catch (error) {
      toast.error("Error preparing document for print", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#ef4444",
          border: "none",
          borderBottom: "1px solid #ef4444",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          zIndex: 9999999999,
        },
      });
      console.error("Print error:", error);
    } finally {
      stopLoading();
    }
  };

  const styles = StyleSheet.create({
    page: {
      padding: 20,
      fontFamily: "AbyssinicaSIL",
      fontSize: 10,
      color: "#333333",
      display: "flex",
      flexDirection: "column",
      height: "100%",
    },
    headerContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      borderBottom: "1px solid #4169a5",
      paddingBottom: 10,
    },
    ethiopicText: {
      color: "#4169a5",
      whiteSpace: "pre-line",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 12,
      minWidth: 120,
      lineHeight: 1,
      fontFamily: "AbyssinicaSIL",
    },
    englishText: {
      color: "#4169a5",
      whiteSpace: "pre-line",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 12,
      minWidth: 120,
      lineHeight: 1,
      fontFamily: "Times-Roman",
    },
    headerLogo: {
      width: 90,
      margin: "0 auto",
    },
    header: {
      textAlign: "center",
      marginBottom: 15,
      fontSize: 9,
      color: "#666666",
    },
    title: {
      textAlign: "center",
      fontSize: 14,
      color: "#1a365d",
      borderBottom: "1px solid #e2e8f0",
      paddingBottom: 5,
      marginBottom: 15,
    },
    section: {
      border: "1px solid #e2e8f0",
      borderRadius: 3,
      padding: 10,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 11,
      color: "#2c5282",
      borderLeft: "2px solid #2b6cb0",
      paddingLeft: 5,
      marginBottom: 5,
    },
    grid: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    gridItem: {
      width: "48%",
      marginBottom: 5,
    },
    label: {
      fontWeight: "900",
      color: "#2d3748",
    },
    footer: {
      textAlign: "center",
      fontSize: 8,
      color: "#666666",
      borderTop: "1px solid #e2e8f0",
      paddingTop: 5,
      marginTop: 15,
    },
    qrCodeContainer: {
      border: "1px solid #e2e8f0",
      borderRadius: 3,
      padding: 5,
      display: "inline-block",
    },
    customFooter: {
      marginTop: "auto",
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
    },
    footerGrid: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      borderTop: "2px solid #fcce03",
      marginTop: 20,
      fontSize: 10,
    },
    footerColumn: {
      flex: 1,
      padding: 6,
    },
    footerText: {
      fontWeight: "bold",
      color: "#4169a5",
      fontFamily: "AbyssinicaSIL",
      fontSize: 6,
      whiteSpace: "pre-line",
      margin: 0,
    },
    textFooter: {
      textAlign: "center",
      marginTop: 10,
      fontSize: 8,
      color: "#718096",
      borderTop: "1px solid #e2e8f0",
      paddingTop: 5,
    },
  });

  const generateQRCode = async (text) => {
    try {
      const canvas = createCanvas(50, 50);
      await QRCode.toCanvas(canvas, text, { width: 50 });
      return canvas.toDataURL();
    } catch (err) {
      console.error("QR code generation error:", err);
      return "";
    }
  };
  // Add this function inside your component, before the return statement
  const getActiveFilterCount = () => {
    let count = 1; // Always count "All" filter

    if (pendingRequestsCount > 0) count++;
    if (underReviewRequestsCount > 0) count++;
    if (underCouncilReviewRequestsCount > 0) count++;
    if (approvedRequestsCount > 0) count++;
    if (decidedRequestsCount > 0) count++;
    if (rejectedRequestsCount > 0) count++;
    if (returnedRequestsCount > 0) count++;

    return count;
  };

  // Add this inside your component
  const filterConfig = [
    {
      key: "all",
      label: t("home.allRequests"),
      count: totalRequestsCount,
      icon: InboxIcon,
      color: "blue",
      alwaysShow: true,
    },
    {
      key: "Pending",
      label: t("home.pendingRequests"),
      count: pendingRequestsCount,
      icon: ClockIcon,
      color: "orange",
    },
    {
      key: "Under Investigation",
      label: t("home.underReviewRequests"),
      count: underReviewRequestsCount,
      icon: ClockIcon,
      color: "orange",
    },
    {
      key: "Under Council Review",
      label: t("home.underCouncilReviewRequests"),
      count: underCouncilReviewRequestsCount,
      icon: ClockIcon,
      color: "purple",
    },
    {
      key: "Approved",
      label: t("home.approvedRequests"),
      count: approvedRequestsCount,
      icon: CheckCircleIcon,
      color: "green",
    },
    {
      key: "Decided",
      label: t("home.decidedRequests"),
      count: decidedRequestsCount,
      icon: CheckCircleIcon,
      color: "green",
    },
    {
      key: "Rejected",
      label: t("home.rejectedRequests"),
      count: rejectedRequestsCount,
      icon: CheckCircleIcon,
      color: "red",
    },
  ];

  // Then in your JSX:
  <div
    className={`flex items-center p-3 flex-wrap rounded-md shadow-inner ${
      filterConfig.filter((f) => f.alwaysShow || f.count > 0).length === 1
        ? "justify-center"
        : ""
    }`}
    style={{ boxShadow: "inset 0 0 5px #3470FF40" }}
  >
    {filterConfig.map((filterItem) => {
      if (!filterItem.alwaysShow && filterItem.count === 0) return null;

      const IconComponent = filterItem.icon;
      const isActive = filter === filterItem.key;

      return (
        <a
          key={filterItem.key}
          className={`cursor-pointer flex items-center px-4 py-2 text-sm ${
            isActive
              ? "text-white border bg-primary rounded-md hover:text-white hover:bg-primary-dark"
              : `text-${filterItem.color}-600 hover:text-${filterItem.color}-800 hover:underline`
          } transition-all duration-300`}
          onClick={() => handleFilterChange(filterItem.key)}
        >
          <IconComponent
            className={`w-5 h-5 ${
              isActive ? "text-white" : `text-${filterItem.color}-600`
            } mr-2`}
          />
          {filterItem.label}
          <span
            className={`ml-2 ${
              isActive ? "text-white" : `text-${filterItem.color}-600`
            }`}
          >
            ({filterItem.count})
          </span>
        </a>
      );
    })}
  </div>;
  const MyDocument = ({ data, qrCodeUrl, logo }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.ethiopicText}>
            የፌደራል ዳኞች አስተዳደር ጉባኤ ጽ/ቤት {"\n"}
          </Text>
          <Image src={logo} style={styles.headerLogo} />
          <Text style={styles.englishText}>
            FEDERAL JUDICIAL ADMINISTRATION COUNCIL SECRETARIAT
          </Text>
        </View>

        <View style={styles.header}>
          <Text>
            Judiciary Complaint Management System - Generated on{" "}
            {format(new Date(), "MMMM dd, yyyy")}
          </Text>
        </View>

        <View style={styles.title}>
          <Text>Request Details</Text>
        </View>

        <View style={{ display: "flex", flexDirection: "row", gap: 15 }}>
          <View style={{ width: "48%" }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Request ID:</Text>
                  <Text>{data.request_id.toString().slice(0, 8)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>QR Code:</Text>
                  <View style={styles.qrCodeContainer}>
                    <Image src={qrCodeUrl} style={{ width: 50, height: 50 }} />
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Status:</Text>
                  <Text>{data.status}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Request Date:</Text>
                  <Text>{data.requestDate}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request Details</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Case Type:</Text>
                  <Text>{data.caseType}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Affair Desc:</Text>
                  <Text>
                    {data.affairDescription.substring(0, 35) +
                      (data.affairDescription.length > 35 ? "..." : "")}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Complaint:</Text>
                  <Text>
                    {data.constitutionalComplaint.substring(0, 35) +
                      (data.constitutionalComplaint.length > 35 ? "..." : "")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ width: "48%" }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Applicant Information</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Name:</Text>
                  <Text>{data.applicantName}</Text>
                </View>

                {data.region !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Region:</Text>
                    <Text>{data.region}</Text>
                  </View>
                )}
                {data.zone !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Zone:</Text>
                    <Text>{data.zone}</Text>
                  </View>
                )}
                {data.city !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>City:</Text>
                    <Text>{data.city}</Text>
                  </View>
                )}

                {data.subCity !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Sub-city:</Text>
                    <Text>{data.subCity}</Text>
                  </View>
                )}
                {data.woreda !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Woreda:</Text>
                    <Text>{data.woreda}</Text>
                  </View>
                )}
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text>{data.phoneNumber}</Text>
                </View>
                {data.representative !== "N/A" && (
                  <>
                    <View style={styles.gridItem}>
                      <Text style={styles.label}>Representative:</Text>
                      <Text>{data.representative}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Respondent Information</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Name:</Text>
                  <Text>{data.respondentName}</Text>
                </View>
                {data.respondentRegion !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Region:</Text>
                    <Text>{data.respondentRegion}</Text>
                  </View>
                )}
                {data.respondentZone !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Zone:</Text>
                    <Text>{data.respondentZone}</Text>
                  </View>
                )}
                {data.respondentCity !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>City:</Text>
                    <Text>{data.respondentCity}</Text>
                  </View>
                )}

                {data.respondentSubCity !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Sub-city:</Text>
                    <Text>{data.respondentSubCity}</Text>
                  </View>
                )}

                {data.respondentWoreda !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Woreda:</Text>
                    <Text>{data.respondentWoreda}</Text>
                  </View>
                )}
                {data.respondentPhone !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text>{data.respondentPhone}</Text>
                  </View>
                )}
                {data.respondentAddress !== "N/A" && (
                  <View style={styles.gridItem}>
                    <Text style={styles.label}>Address:</Text>
                    <Text>{data.respondentAddress}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.textFooter}>
          <Text>FEDERAL JUDICIAL ADMINISTRATION COUNCIL SECRETARIAT </Text>
          <Text>
            Contact: fjacouncil@gmail.com | Judiciary Complaint Management
            System
          </Text>
        </View>

        <View style={styles.customFooter}>
          <View style={styles.footerGrid}>
            <View
              style={[
                styles.footerColumn,
                { borderRight: "2px solid #fcce03" },
              ]}
            >
              <Text style={styles.footerText}>
                ስልክ/Tel: +251 11-1-116888{"\n"}: +251 11-1-562289{"\n"}: +251
                11-1-266724{"\n"}
                ነፃ የስልክ መስመር: 6939
              </Text>
            </View>
            <View
              style={[
                styles.footerColumn,
                {
                  borderRight: "2px solid #fcce03",
                  textAlign: "center",
                },
              ]}
            >
              <Text style={styles.footerText}>
                ፋክስ/Fax: +251 11-1-116888{"\n"}
                ፓ.ሳ.ቁ/P.O.Box: 22627{"\n"}
                አዲስ አበባ{"\n"}
                Addis Ababa
              </Text>
            </View>
            <View style={[styles.footerColumn, { textAlign: "center" }]}>
              <Text style={styles.footerText}>
                ኢ-ሜይል/E-mail: constitutionalinquiry.et@gmail.com{"\n"}
                ድረ-ገፅ/Website: www.cci.gov.et{"\n"}
                ፌስቡክ-ገፅ: http://www.facebook.com/CCIFDRE/{"\n"}
                ቴሌግራም/Telegram: https://t.me/CCI-sec
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );

  const handleDownload = async (request_id) => {
    startLoading();
    try {
      const response = await requestService.getRequestById(request_id);
      if (response) {
        const applicant = response.applicants?.[0] || {};
        const respondent = response.respondents?.[0] || {};

        const formattedRequestId = `#${request_id.toString().slice(0, 8)}`;

        const data = {
          request_id: formattedRequestId,
          applicantName:
            applicant.applicant_name || response.data?.applicantNames || "N/A",
          status: response.status || "N/A",
          requestDate: response.request_date
            ? format(new Date(response.request_date), "MMMM dd, yyyy")
            : "N/A",
          region: applicant.region?.name || response.applicantRegions || "N/A",
          zone: applicant.zone?.name || response.applicantZones || "N/A",
          city: applicant.city?.name || response.applicantCity || "N/A",
          subCity:
            applicant.subcity?.name || response.applicantSubCity || "N/A",
          woreda: applicant.woreda?.name || response.applicantWoredas || "N/A",
          representative: response.representative_name || "N/A",
          respondentName:
            respondent.respondent_name || response.respondentNames || "N/A",
          affairDescription: response.affair_description || "N/A",
          caseType: response.caseType?.name || response.caseTypeName || "N/A",
          constitutionalComplaint:
            response.constitutional_complaint_summary || "N/A",
          phoneNumber: applicant.phone_number || response.phone_number || "N/A",
          respondentRegion:
            respondent.region?.name || response.respondentRegions || "N/A",
          respondentZone:
            respondent.zone?.name || response.respondentZones || "N/A",
          respondentCity:
            respondent.city?.name || response.respondentCities || "N/A",
          respondentSubCity:
            respondent.subcity?.name || response.respondentSubCities || "N/A",
          respondentWoreda:
            respondent.woreda?.name || response.respondentWoredas || "N/A",
          respondentPhone:
            respondent.respondentPhoneNumber ||
            response.respondentPhoneNumber ||
            "N/A",
          respondentAddress:
            respondent.respondentAddress || response.respondentAddress || "N/A",
        };

        const qrCodeUrl = await generateQRCode(data.request_id);

        const blob = await pdf(
          <MyDocument data={data} qrCodeUrl={qrCodeUrl} logo={logo} />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cci_request_${request_id.toString().slice(0, 8)}.pdf`;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        toast.success("Request details downloaded successfully");
      } else {
        toast.error("Failed to fetch request details", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#ffffff",
            color: "#ef4444",
            border: "none",
            borderBottom: "1px solid #ef4444",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            zIndex: 9999999999,
          },
        });
      }
    } catch (error) {
      toast.error("Error downloading request details", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: "#ffffff",
          color: "#ef4444",
          border: "none",
          borderBottom: "1px solid #ef4444",
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          zIndex: 9999999999,
        },
      });
      console.error("Download error:", error);
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      {loading ? (
        <LoadingPage />
      ) : (
        hasAnyRequests && (
          <div className="w-full max-w-[clamp(320px,98.96vw,1900px)] lg:px-[clamp(16px,5.21vw,80px)] md:px-[clamp(16px,5.21vw,80px)] min-h-screen flex mx-auto flex-col">
            <div className="flex items-center justify-between my-[clamp(24px,1.67vh,24px)] flex-wrap">
              {/* <h2 className="text-lg font-semibold text-gray-800 ">
                Welcome back,{" "}
                <span className="text-indigo-600">
                  {userProfile ? userProfile.full_name : null}
                </span>
              </h2> */}
            </div>

            {/* Case's You Requested Heading */}
            <h1 className="font-['Montserrat'] font-semibold text-[clamp(24px,1.67vw,32px)] leading-none text-center text-[#073954]">
              Your Reports
            </h1>

            {/* Prerequisites Text */}
            <p className="font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none text-center text-[#B8B8B8] mt-[clamp(8px,0.42vw,8px)] max-w-[clamp(320px,29.17vw,560px)] mx-auto">
              These are the complaints and disciplinary reports you have reported to the Federal Judicial Administration Council Secretariat (FJACS).
            </p>
            {/* Request Type Toggle */}
            <div className="mb-[clamp(16px,0.83vw,16px)] mt-[clamp(16px,0.83vw,16px)] sm:mb-[clamp(24px,1.25vw,24px)]">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-[clamp(2px,0.14vh,2px)] sm:p-[clamp(4px,0.21vw,4px)] rounded-lg shadow-sm w-full max-w-[clamp(320px,20.83vw,448px)]">
                  <div className="flex items-center space-x-[clamp(2px,0.14vh,2px)] sm:space-x-[clamp(4px,0.21vw,4px)]">
                    {/* Disciplinary Toggle */}
                    <button
                      onClick={() => handleRequestTypeChange("disciplinary")}
                      className={`flex items-center justify-center px-[clamp(8px,0.42vw,8px)] sm:px-[clamp(16px,0.83vw,16px)] md:px-[clamp(24px,1.25vw,24px)] py-[clamp(8px,0.52vw,12px)] sm:py-[clamp(12px,0.69vh,12px)] rounded-md transition-all duration-300 flex-1 font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none ${
                        requestType === "disciplinary"
                          ? "bg-white text-primary shadow-md transform scale-105"
                          : "text-[#B8B8B8] hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <span className="hidden sm:inline">
                        Disciplinary
                      </span>
                      <span className="sm:hidden">Disciplinary</span>
                    </button>

                    {/* Divider */}
                    <div className="w-[clamp(0.5px,0.05vw,1px)] h-[clamp(20px,1.25vw,24px)] sm:h-[clamp(24px,1.67vw,32px)] bg-gray-300"></div>

                    {/* Complaint Toggle */}
                    <button
                      onClick={() => handleRequestTypeChange("complaint")}
                      className={`flex items-center justify-center px-[clamp(8px,0.42vw,8px)] sm:px-[clamp(16px,0.83vw,16px)] md:px-[clamp(24px,1.25vw,24px)] py-[clamp(8px,0.52vw,12px)] sm:py-[clamp(12px,0.69vh,12px)] rounded-md transition-all duration-300 flex-1 font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none ${
                        requestType === "complaint"
                          ? "bg-white text-primary shadow-md transform scale-105"
                          : "text-[#B8B8B8] hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <span className="hidden sm:inline">
                        Complaint
                      </span>
                      <span className="sm:hidden">Complaint</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Request Type Indicator */}
              {/* <div className="text-center mt-2 sm:mt-3">
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {requestType === "disciplinary" ? (
                    <>
                      <ScaleIcon className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">
                        Showing Disciplinary Cases
                      </span>
                      <span className="sm:hidden">Disciplinary Cases</span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">
                        Showing Complaint Cases
                      </span>
                      <span className="sm:hidden">Complaint Cases</span>
                    </>
                  )}
                </span>
              </div> */}
            </div>
            {/* Main content container with horizontal margins (approx. 167px on large screens) */}
            <div className="px-[clamp(16px,0.83vw,16px)] sm:px-[clamp(32px,1.67vw,32px)] lg:px-[clamp(80px,4.17vw,80px)]">
              {/* Filter Section Header */}
              {/* Dynamic Filter Section */}
              {/* <div className="mb-[clamp(16px,0.83vw,16px)]">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {requestType === "disciplinary"
                    ? "Disciplinary Request Filters"
                    : "Complaint Request Filters"}
                </h3>
                <p className="text-sm text-gray-500">
                  Filter your{" "}
                  {requestType === "disciplinary"
                    ? "disciplinary"
                    : "complaint"}{" "}
                  requests by status
                </p>
              </div> */}

              <div className="flex items-center justify-between my-[clamp(24px,1.67vh,24px)] flex-wrap">
                <div
                  className={`flex items-center p-[clamp(10px,0.52vw,12px)] flex-wrap gap-[clamp(8px,0.42vw,8px)] rounded-md shadow-inner ${
                    // Center the filters when there's only one active tab
                    getActiveFilterCount() === 1 ? "justify-center" : ""
                  }`}
                  style={{ boxShadow: "inset 0 0 5px #3470FF40" }}
                >
                  {/* Always show "All" filter */}
                  <a
                    className={`cursor-pointer flex items-center justify-center ${
                      filter === "all"
                        ? "text-white bg-[#215167] rounded-[clamp(8px,0.52vw,10px)] shadow-[0px_4px_4px_0px_#00000040] h-[clamp(40px,4.07vh,44px)] gap-[clamp(8px,0.65vw,10px)] py-[clamp(12px,1.2vh,13px)] px-[clamp(16px,0.94vw,18px)] hover:bg-[#215167] text-[clamp(12px,0.73vw,14px)]"
                        : "text-[#215167] bg-[#F2F2F2] rounded-[clamp(8px,0.52vw,10px)] h-[clamp(40px,4.07vh,44px)] gap-[clamp(8px,0.65vw,10px)] py-[clamp(12px,1.2vh,13px)] px-[clamp(8px,0.52vw,10px)] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[clamp(13px,0.78vw,15px)] leading-none tracking-normal text-center"
                    } transition-all duration-300`}
                    onClick={() => handleFilterChange("all")}
                  >
                    {t("home.allRequests")}
                    {/* <span
                      className={`ml-2 ${
                        filter === "all" ? "text-white" : "text-[#215167]"
                      }`}
                    >
                      ({totalRequestsCount})
                    </span> */}
                  </a>

                  {/* Show Pending only when there are pending requests */}
                  {pendingRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Pending"
                          ? "text-white bg-[#215167] rounded-[clamp(8px,0.52vw,10px)] shadow-[0px_4px_4px_0px_#00000040] h-[clamp(40px,4.07vh,44px)] gap-[clamp(8px,0.65vw,10px)] py-[clamp(12px,1.2vh,13px)] px-[clamp(16px,0.94vw,18px)] hover:bg-[#215167] text-[clamp(12px,0.73vw,14px)]"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[clamp(8px,0.52vw,10px)] h-[clamp(40px,4.07vh,44px)] gap-[clamp(8px,0.65vw,10px)] py-[clamp(12px,1.2vh,13px)] px-[clamp(8px,0.52vw,10px)] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[clamp(13px,0.78vw,15px)] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Pending")}
                    >
                      {t("home.pendingRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Pending"
                            ? "text-white"
                            : "text-[#215167]"
                        }`}
                      >
                        ({pendingRequestsCount})
                      </span> */}
                    </a>
                  )}

                  {/* Show Under Investigation only when there are under investigation requests */}
                  {underReviewRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Under Investigation"
                          ? "text-white bg-[#215167] rounded-[10px] shadow-[0px_4px_4px_0px_#00000040] h-[44px] gap-2.5 py-[13px] px-[18px] hover:bg-[#215167] text-sm"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[10px] h-[44px] gap-2.5 py-[13px] px-[10px] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[15px] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Under Investigation")}
                    >
                      {t("home.underReviewRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Under Investigation"
                            ? "text-white"
                            : "text-[#215167]"
                        }`}
                      >
                        ({underReviewRequestsCount})
                      </span> */}
                    </a>
                  )}

                  {/* Show Under Council Review only when there are such requests */}
                  {underCouncilReviewRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Under Council Review"
                          ? "text-white bg-[#215167] rounded-[10px] shadow-[0px_4px_4px_0px_#00000040] h-[44px] gap-2.5 py-[13px] px-[18px] hover:bg-[#215167] text-sm"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[10px] h-[44px] gap-2.5 py-[13px] px-[10px] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[15px] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Under Council Review")}
                    >
                      {t("home.underCouncilReviewRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Under Council Review"
                            ? "text-white"
                            : "text-[#215167]"
                        }`}
                      >
                        ({underCouncilReviewRequestsCount})
                      </span> */}
                    </a>
                  )}

                  {/* Show Approved only when there are approved requests */}
                  {approvedRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Approved"
                          ? "text-white bg-[#215167] rounded-[10px] shadow-[0px_4px_4px_0px_#00000040] h-[44px] gap-2.5 py-[13px] px-[18px] hover:bg-[#215167] text-sm"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[10px] h-[44px] gap-2.5 py-[13px] px-[10px] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[15px] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Approved")}
                    >
                      {t("home.approvedRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Approved"
                            ? "text-white"
                            : "text-[#215167]"
                        }`}
                      >
                        ({approvedRequestsCount})
                      </span> */}
                    </a>
                  )}

                  {/* Show Decided only when there are decided requests */}
                  {decidedRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Decided"
                          ? "text-white bg-[#215167] rounded-[10px] shadow-[0px_4px_4px_0px_#00000040] h-[44px] gap-2.5 py-[13px] px-[18px] hover:bg-[#215167] text-sm"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[10px] h-[44px] gap-2.5 py-[13px] px-[10px] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[15px] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Decided")}
                    >
                      {t("home.decidedRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Decided" ? "text-white" : "text-[#215167]"
                        }`}
                      >
                        ({decidedRequestsCount})
                      </span> */}
                    </a>
                  )}

                  {/* Show Rejected only when there are rejected requests */}
                  {rejectedRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Rejected"
                          ? "text-white bg-[#215167] rounded-[10px] shadow-[0px_4px_4px_0px_#00000040] h-[44px] gap-2.5 py-[13px] px-[18px] hover:bg-[#215167] text-sm"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[10px] h-[44px] gap-2.5 py-[13px] px-[10px] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[15px] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Rejected")}
                    >
                      {t("home.rejectedRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Rejected" ? "text-white" : "text-[#215167]"
                        }`}
                      >
                        ({rejectedRequestsCount})
                      </span> */}
                    </a>
                  )}

                  {/* Show Returned only when there are returned requests */}
                  {returnedRequestsCount > 0 && (
                    <a
                      className={`cursor-pointer flex items-center justify-center ${
                        filter === "Returned"
                          ? "text-white bg-[#215167] rounded-[10px] shadow-[0px_4px_4px_0px_#00000040] h-[44px] gap-2.5 py-[13px] px-[18px] hover:bg-[#215167] text-sm"
                          : "text-[#215167] bg-[#F2F2F2] rounded-[10px] h-[44px] gap-2.5 py-[13px] px-[10px] hover:bg-[#E5E5E5] font-['Montserrat'] font-medium text-[15px] leading-none tracking-normal text-center"
                      } transition-all duration-300`}
                      onClick={() => handleFilterChange("Returned")}
                    >
                      {t("home.returnedRequests")}
                      {/* <span
                        className={`ml-2 ${
                          filter === "Returned" ? "text-white" : "text-[#215167]"
                        }`}
                      >
                        ({returnedRequestsCount})
                      </span> */}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-[clamp(16px,0.83vw,16px)] relative">
                  <button
                    type="button"
                    ref={createButtonRef}
                    className="flex items-center w-[clamp(160px,9.64vw,185px)] h-[clamp(44px,4.44vh,48px)] rounded-lg gap-[clamp(8px,0.65vw,10px)] py-[clamp(8px,0.52vw,8px)] px-[clamp(20px,1.04vw,20px)] bg-[#215167] text-white hover:bg-[#1a4050] transition-colors font-['Montserrat'] font-medium text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal"
                    onClick={handleCreateRequest}
                  >
                    <PlusIcon className="w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] text-white" />
                    {t("home.createRequest")}
                  </button>
                  <NewRequestModal
                    isOpen={showNewRequestModal}
                    onClose={() => setShowNewRequestModal(false)}
                    buttonRef={createButtonRef.current}
                  />
                </div>
              </div>
              {/* <div className="w-full border-t border-gray-300 mt-4"></div> */}

              {!isExpanded && (
                <>
                  {cardsLoading ? (
                    <div className="flex flex-col items-center justify-center text-center p-[clamp(32px,2.08vw,32px)] w-full">
                      <Spinner className="text-white h-10 w-10" />
                    </div>
                  ) : sortedRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-[clamp(32px,2.08vw,32px)]">
                      <img
                        src="/jcdms-applicant/img/Empty-amico.png"
                        alt="No Data Found"
                        className="w-[clamp(200px,33.33vw,256px)] h-[clamp(200px,29.63vh,256px)] mb-[clamp(24px,1.67vh,24px)]"
                      />
                      <div className="text-[clamp(20px,1.04vw,24px)] font-semibold text-gray-800 mb-[clamp(8px,0.42vw,8px)]">
                        No Data Available
                      </div>
                      <div className="text-[clamp(12px,0.73vw,14px)] text-gray-500 mb-[clamp(24px,1.67vh,24px)]">
                        There are no reports to display.
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${
                        sortedRequests.length > 10
                          ? "flex flex-wrap"
                          : "flex flex-wrap mb-[clamp(200px,27.78vh,300px)]"
                      }  grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-x-[clamp(32px,2.5vw,48px)] gap-y-[clamp(32px,3.33vh,48px)] `}
                    >
                      {sortedRequests.map((request) => {
                        const {
                          icon,
                          applicantNames,
                          applicantRegions,
                          applicantZones,
                          applicantWoredas,
                          applicantPhoneNumber,
                          applicantCity,
                          applicantSubCity,
                          archives,
                          status,
                          representative_name,
                          phone,
                          phone_additional,
                          gender,
                          respondentNames,
                          request_date,
                          request_id,
                          requestDocuments,
                          documentStatusCount,
                          judge_name,
                          court_office,
                          file_number,
                          signature_url,
                          issues,
                          judge_court,
                          case_file_number,
                          case_type,
                          act_date,
                          submission_date,
                          evidences,
                          witnesses,
                        } = request;

                        return (
                          <div key={request_id} className=" h-full">
                            <div
                              className="shadow-inherit rounded-lg h-full  hover:shadow-lg"
                              style={{
                                boxShadow: "0 4px 15px #3470FF40",
                              }}
                            >
                              {requestType === "disciplinary" ? (
                                <DisciplinaryCard3
                                  request_id={request_id}
                                  applicantName={applicantNames}
                                  status={status}
                                  judge_name={judge_name}
                                  court_office={court_office}
                                  file_number={file_number}
                                  request_date={request_date}
                                  evidences={evidences}
                                  onDelete={handleDelete}
                                  onPrint={handlePrint}
                                  onDownload={handleDownload}
                                />
                              ) : (
                                <ComplaintCard3
                                  complaint_id={request_id}
                                  applicantName={applicantNames}
                                  status={status}
                                  judge_name={judge_name}
                                  judge_court={judge_court}
                                  case_file_number={case_file_number}
                                  case_type={case_type}
                                  act_date={act_date}
                                  submission_date={submission_date}
                                  evidences={evidences}
                                  witnesses={witnesses}
                                  onDelete={handleDelete}
                                  onPrint={handlePrint}
                                  onDownload={handleDownload}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!cardsLoading && sortedRequests && sortedRequests.length > 0 && (
                    <div className="flex flex-col items-center gap-[clamp(16px,0.83vw,16px)] mt-[clamp(32px,2.08vw,32px)]">
                      <div className="flex items-center gap-[clamp(10px,0.52vw,12px)]">
                        <span className="text-[clamp(12px,0.73vw,14px)] font-medium text-gray-600">
                          Show rows:
                        </span>
                        <div className="relative">
                          <select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="appearance-none pl-[clamp(10px,0.52vw,12px)] pr-[clamp(32px,1.67vw,32px)] py-[clamp(6px,0.52vw,6px)] text-[clamp(12px,0.73vw,14px)] bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                          >
                            {itemsPerPageOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-[clamp(8px,0.42vw,8px)]">
                            <ChevronUpDownIcon className="h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)] text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-[clamp(16px,0.83vw,16px)]">
                        <button
                          aria-label="Previous Page"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`inline-flex items-center gap-[clamp(4px,0.21vw,4px)] px-[clamp(10px,0.52vw,12px)] py-[clamp(8px,0.52vw,8px)] text-[clamp(12px,0.73vw,14px)] font-medium rounded-md border ${
                            currentPage === 1
                              ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                              : "text-blue-600 border-blue-200 bg-white hover:bg-blue-50"
                          } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <ChevronLeftIcon className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]" />
                          Previous
                        </button>

                        <div className="flex items-center gap-[clamp(4px,0.21vw,4px)] text-[clamp(12px,0.73vw,14px)] text-gray-600">
                          <span>Page</span>
                          <span className="font-semibold text-blue-600">
                            {currentPage}
                          </span>
                          <span>of</span>
                          <span className="font-semibold text-blue-600">
                            {totalPages}
                          </span>
                        </div>

                        <button
                          aria-label="Next Page"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`inline-flex items-center gap-[clamp(4px,0.21vw,4px)] px-[clamp(10px,0.52vw,12px)] py-[clamp(8px,0.52vw,8px)] text-[clamp(12px,0.73vw,14px)] font-medium rounded-md border ${
                            currentPage === totalPages
                              ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                              : "text-blue-600 border-blue-200 bg-white hover:bg-blue-50"
                          } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          Next
                          <ChevronRightIcon className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)]" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      )}

      {createPortal(
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Zoom}
          containerClassName="!fixed !top-0 !right-0 !z-[9999999999]"
          toastClassName="!z-[9999999999]"
          style={{ zIndex: 9999999999 }}
        />,
        document.body
      )}
      <ConfirmDialog
        open={openConfirmDialog}
        onClose={handleCloseDialog}
        onConfirm={() => handleConfirmDelete(requestId)}
        title={t("home.deleteTitle")}
        description={t("home.deleteDescription")}
      />
    </div>
  );
}

export default Home;
