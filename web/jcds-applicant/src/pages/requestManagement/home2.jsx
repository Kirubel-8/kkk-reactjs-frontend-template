import { useLoading } from "@/loading-context";
import { Button, Card, Typography } from "@material-tailwind/react";
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

import customerAuthService from "@/service/customer-auth.service";
import StatisticsCardHome from "@/widgets/cards/statistics-card-home";
import DisciplinaryCardHome from "@/widgets/cards/disciplinary-card-home";
import NewRequestModal from "../newRequest/newRequest-modal";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ClockIcon,
  InboxIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import {
  default as RequestService,
  default as requestService,
} from "../../service/request.service";
import ConfirmDialog from "./delete-modal";
import LoadingPage from "./loading-page";

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
  const customerAccountToken = localStorage.getItem("customerAccountToken");
  const [userProfile, setUserProfile] = useState(null);
  const itemsPerPageOptions = [8, 16, 32, 50, 100];
  const [requestsData, setRequestsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState();

  const [filter, setFilter] = useState("all");
  const [documents, setDocuments] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [requestId, setRequestId] = useState();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0]);
  const [allRequestsCount, setAllRequestsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [underReviewRequestsCount, setUnderReviewRequestsCount] = useState(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState(0);
  const [decidedRequestsCount, setDecidedRequestsCount] = useState(0);
  const [rejectedRequestsCount, setRejectedRequestsCount] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestType, setRequestType] = useState("disciplinary"); // "disciplinary" or "complaint"

  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandLoadingState, setExpandLoadingState] = useState({});
  const [selectedRequestData, setSelectedRequestData] = useState();
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
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
      'all': null,
      'Pending': 'pending',
      'Under Review': 'under_investigation',
      'Approved': 'accepted',
      'Decided': 'Decided',
      'Rejected': 'rejected'
    };
    return statusMap[filter] || null;
  };

  // Filter requests by status on frontend
  const filterRequestsByStatus = (requests, filterType) => {
    if (filterType === 'all') {
      return requests;
    }
    
    const statusMap = {
      'Pending': 'pending',
      'Under Review': 'under_investigation',
      'Approved': 'accepted',
      'Decided': 'Decided',
      'Rejected': 'rejected'
    };
    
    const targetStatus = statusMap[filterType];
    return requests.filter(request => request.status === targetStatus);
  };

  const handleRequestTypeChange = (type) => {
    setRequestType(type);
    setCurrentPage(1);
    setFilter("all");
    // Reset counts when switching types
    setAllRequestsCount(0);
    setPendingRequestsCount(0);
    setUnderReviewRequestsCount(0);
    setApprovedRequestsCount(0);
    setDecidedRequestsCount(0);
    setRejectedRequestsCount(0);
  };
  

  const handleDisciplineRequest = () => {
    navigate("/home/disciplinary-request");
  };

  const handleComplaintRequest = () => {
    navigate("/home/complaint-request");
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
        toast.error("Failed to delete request");
        handleDeleteNavigation("/home/requests");
      }
    } catch (error) {
      toast.error("Error deleting request");
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

  const fetchRequestsData = async () => {
    try {
      setLoading(true);
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
        });
        return;
      }

      const decodedToken = jwtDecode(token);
      const customerId = decodedToken.id;
      
      // Fetch ALL data without any status filter
      let data;
      
      if (requestType === "disciplinary") {
        data = await RequestService.getDisciplinaryRequestsByCustomerId(customerId, {
          filter: null, // Get all data
          sortOrder,
          page: 1,
          limit: 1000, // Get a large number to fetch all records
        });
      } else {
        data = await RequestService.getComplaintRequestsByCustomerId(customerId, {
          filter: null, // Get all data
          sortOrder,
          page: 1,
          limit: 1000, // Get a large number to fetch all records
        });
      }
      
      // Map backend response to frontend format
      const mappedRequests = data.discliplinary_complaints?.map((complaint) => {
        return {
          request_id: complaint.disciplinary_complaint_id,
          applicantNames: complaint.applicant?.full_name || "N/A",
          applicantRegions: "N/A", // Not available in backend response
          applicantZones: "N/A", // Not available in backend response
          applicantWoredas: "N/A", // Not available in backend response
          applicantPhoneNumber: "N/A", // Not available in backend response
          applicantCity: "N/A", // Not available in backend response
          applicantSubCity: "N/A", // Not available in backend response
          status: complaint.status,
          representative_name: "N/A", // Not available in backend response
          respondentNames: complaint.judge_name || "N/A",
          request_date: complaint.createdAt,
          judge_name: complaint.judge_name,
          court_office: complaint.court_office,
          file_number: complaint.file_number,
          signature_url: complaint.signature_url,
          issues: complaint.issues || [],
          evidences: complaint.evidences || [],
          icon: ScaleIcon, // Use ScaleIcon for disciplinary requests
          archives: complaint.evidences?.length || 0,
          documents: complaint.evidences || [],
          documentStatusCount: {
            approved: 0,
            pending: complaint.evidences?.length || 0,
            rejected: 0
          }
        };
      }) || [];

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
      
      // Store all data
      setRequestsData(requestsWithDocuments);
      
      // Calculate counts based on ALL data
      const allCount = requestsWithDocuments.length;
      const pendingCount = requestsWithDocuments.filter(c => c.status === 'pending').length;
      const underReviewCount = requestsWithDocuments.filter(c => c.status === 'under_investigation').length;
      const approvedCount = requestsWithDocuments.filter(c => c.status === 'accepted').length;
      const decidedCount = requestsWithDocuments.filter(c => c.status === 'Decided').length;
      const rejectedCount = requestsWithDocuments.filter(c => c.status === 'rejected').length;
      
      setAllRequestsCount(allCount);
      setPendingRequestsCount(pendingCount);
      setUnderReviewRequestsCount(underReviewCount);
      setApprovedRequestsCount(approvedCount);
      setDecidedRequestsCount(decidedCount);
      setRejectedRequestsCount(rejectedCount);
    } catch (error) {
      console.error("Error fetching request data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 100);
  };

  const handleOpenNewRequestModal = () => {
    setShowNewRequestModal(true);
  };

  const handleCloseNewRequestModal = () => {
    setShowNewRequestModal(false);
  };

  const handleDelete = async (requestId) => {
    setTimeout(() => {
      startLoading();
      setRequestsData((prevRequests) =>
        prevRequests.filter((request) => request.request_id !== requestId)
      );
      stopLoading();
    }, 2000);
    await fetchRequestsData();
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
  }, [requestType]); // Only fetch when requestType changes

  // Apply frontend filtering and pagination
  const filteredRequests = filterRequestsByStatus(requestsData, filter);
  const sortedRequests = sortData(filteredRequests, sortOrder);
  
  // Apply pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex);
  
  // Update total pages when filter changes
  useEffect(() => {
    setTotalPages(Math.ceil(filteredRequests.length / itemsPerPage));
    if (currentPage > Math.ceil(filteredRequests.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filter, filteredRequests.length, itemsPerPage]);

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
        toast.error("Failed to fetch request details");
      }
    } catch (error) {
      toast.error("Error preparing document for print");
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
        toast.error("Failed to fetch request details");
      }
    } catch (error) {
      toast.error("Error downloading request details");
      console.error("Download error:", error);
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      {loading ? (
        <LoadingPage />
      ) : requestsData && allRequestsCount === 0 ? (
        <div className="flex flex-col mt-8 lg:flex-row items-center justify-center text-center lg:text-center">
          <div className="lg:w-1/2 flex flex-col items-center">
            <div class="flex flex-col items-center">
              <div class="text-center lg:text-center">
                <div class="text-2xl lg:text-5xl font-semibold text-primary mb-6">
                  {t("home.noRequestFound")}
                </div>
                <div class="text-sm text-gray-500 mb-6">
                  {t("home.noRequestFoundDetail")}
                </div>
              </div>
            </div>

            {/* <div className="flex items-center justify-center gap-2">
              <button
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => handleNavigation("/complaint-request")}
              >
                <PlusIcon className="w-5 h-5 mr-2 text-white" />
                {t("home.createComplaintRequest")}
              </button>

              <button
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => handleNavigation("/disciplinary-request")}
              >
                <PlusIcon className="w-5 h-5 mr-2 text-white" />
                {t("home.createDisciplinaryRequest")}
              </button>
              
            </div> */}
            <div className="max-w-5xl mx-auto bg-white  rounded-lg   p-6 flex flex-col">

              {/* Request Options */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-10 px-4 py-6">
                {/* Disciplinary Case Reports */}
                <Card className="p-6 bg-white shadow-md rounded-lg border border-gray-100">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <ScaleIcon className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1" >
                      <Typography variant="h5" className="text-primary font-bold mb-2">
                        Disciplinary Case Requests
                      </Typography>
                      <Typography variant="paragraph" className="text-gray-600 mb-4">
                        Report any disciplinary issue against judges or court workers.
                      </Typography>
                      
                      {/* Button */}
                      <Button 
                        color="blue" 
                        size="md" 
                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 flex items-center space-x-2"
                        onClick={handleDisciplineRequest}
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Disciplinary report</span>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Complaint Case Reports */}
                <Card className="p-6 bg-white shadow-md rounded-lg border border-gray-100">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <ExclamationTriangleIcon className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <Typography variant="h5" className="text-primary font-bold mb-2">
                        Complaint Case Requests
                      </Typography>
                      <Typography variant="paragraph" className="text-gray-600 mb-4">
                        Report any disciplinary issue against judges or court workers.
                      </Typography>
                      
                      {/* Button */}
                      <Button 
                        color="blue" 
                        size="md" 
                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 flex items-center space-x-2"
                        onClick={handleComplaintRequest}
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Complaint report</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
              </div>
          </div>
          <div className="lg:w-1/2 mt-6 lg:mt-0 flex justify-center">
            <img
              src="/jcdms-applicant/img/Courts-logo.png"
              alt="Side Image"
              className="w-80 h-80 lg:w-96 lg:h-96"
            />
          </div>
        </div>
      ) : (
        requestsData &&
        allRequestsCount >= 0 && (
          <div className="w-full lg:px-20 md:px-20 min-h-screen flex flex-col">
            <div className="flex items-center justify-between my-6 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800 ">
                Welcome back,{" "}
                <span className="text-indigo-600">
                  {userProfile ? userProfile.full_name : null}
                </span>
                !
              </h2>

              <div className="flex items-center gap-4">
                {" "}
                <button
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  onClick={handleOpenNewRequestModal}
                >
                  <PlusIcon className="w-5 h-5 mr-2 text-white" />
                  {t("home.createRequest")}
                </button>
              </div>
            </div>

            {/* Request Type Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="bg-gray-100 p-1 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-1">
                    {/* Disciplinary Toggle */}
                    <button
                      onClick={() => handleRequestTypeChange("disciplinary")}
                      className={`flex items-center px-6 py-3 rounded-md font-medium text-sm transition-all duration-300 ${
                        requestType === "disciplinary"
                          ? "bg-white text-primary shadow-md transform scale-105"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <ScaleIcon className="w-5 h-5 mr-2" />
                      <span>Disciplinary Requests</span>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-8 bg-gray-300"></div>

                    {/* Complaint Toggle */}
                    <button
                      onClick={() => handleRequestTypeChange("complaint")}
                      className={`flex items-center px-6 py-3 rounded-md font-medium text-sm transition-all duration-300 ${
                        requestType === "complaint"
                          ? "bg-white text-primary shadow-md transform scale-105"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                      <span>Complaint Requests</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Request Type Indicator */}
              <div className="text-center mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {requestType === "disciplinary" ? (
                    <>
                      <ScaleIcon className="w-3 h-3 mr-1" />
                      Showing Disciplinary Cases
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      Showing Complaint Cases
                    </>
                  )}
                </span>
              </div>
            </div>
            <div>
              {/* Filter Section Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {requestType === "disciplinary" ? "Disciplinary Request Filters" : "Complaint Request Filters"}
                </h3>
                <p className="text-sm text-gray-500">
                  Filter your {requestType === "disciplinary" ? "disciplinary" : "complaint"} requests by status
                </p>
              </div>

              <div className="flex items-center justify-between my-6 flex-wrap">
                <div
                  className="flex items-center p-3 flex-wrap  rounded-md shadow-inner"
                  style={{ boxShadow: "inset 0 0 5px #3470FF40" }}
                >
                  <a
                    className={`cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "all"
                        ? "text-white border bg-[#4475F2] rounded-md hover:text-white hover:bg-[#3e71f2]"
                        : "text-blue-600 hover:text-blue-800 hover:underline"
                    } transition-all duration-300`}
                    onClick={() => handleFilterChange("all")}
                  >
                    <InboxIcon
                      className={`w-5 h-5 ${
                        filter === "all" ? "text-white  " : "text-blue-600"
                      } mr-2`}
                    />
                    {t("home.allRequests")}
                    <span
                      className={`ml-2 ${
                        filter === "all" ? "text-white  " : "text-blue-600"
                      }`}
                    >
                      ({allRequestsCount})
                    </span>
                  </a>

                  <a
                    className={`cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Pending"
                        ? "text-white border bg-[#4475F2] rounded-md hover:text-white hover:bg-[#3e71f2]"
                        : "text-orange-600 hover:text-orange-800 hover:underline"
                    } transition-all duration-300`}
                    onClick={() => handleFilterChange("Pending")}
                  >
                    <ClockIcon
                      className={`w-5 h-5 ${
                        filter === "Pending"
                          ? "text-white  "
                          : "text-orange-600"
                      } mr-2`}
                    />
                    {t("home.pendingRequests")}
                    <span
                      className={`ml-2 ${
                        filter === "Pending"
                          ? "text-white  "
                          : "text-orange-600"
                      }`}
                    >
                      ({pendingRequestsCount})
                    </span>
                  </a>

                  <a
                    className={`cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Under Review"
                        ? "text-white border bg-[#4475F2] rounded-md hover:text-white hover:bg-[#3e71f2]"
                        : "text-orange-600 hover:text-orange-800 hover:underline"
                    } transition-all duration-300`}
                    onClick={() => handleFilterChange("Under Review")}
                  >
                    <ClockIcon
                      className={`w-5 h-5 ${
                        filter === "Under Review"
                          ? "text-white  "
                          : "text-orange-600"
                      } mr-2`}
                    />
                    {t("home.underReviewRequests")}
                    <span
                      className={`ml-2 ${
                        filter === "Under Review"
                          ? "text-white  "
                          : "text-orange-600"
                      }`}
                    >
                      ({underReviewRequestsCount})
                    </span>
                  </a>

                  <a
                    className={` cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Approved"
                        ? "text-white border bg-[#4475F2] rounded-md hover:text-white hover:bg-[#3e71f2]"
                        : "text-green-600 hover:text-green-800 hover:underline"
                    }  transition-all duration-300`}
                    onClick={() => handleFilterChange("Approved")}
                  >
                    <CheckCircleIcon
                      className={`w-5 h-5 ${
                        filter === "Approved" ? "text-white" : "text-green-600"
                      } mr-2 text-green-600`}
                    />
                    {t("home.approvedRequests")}
                    <span
                      className={`ml-2 ${
                        filter === "Approved" ? "text-white" : "text-green-600"
                      }`}
                    >
                      ({approvedRequestsCount})
                    </span>
                  </a>

                  <a
                    className={` cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Decided"
                        ? "text-white border bg-[#4475F2] rounded-md hover:text-white hover:bg-[#3e71f2]"
                        : "text-green-600 hover:text-green-800 hover:underline"
                    }  transition-all duration-300`}
                    onClick={() => handleFilterChange("Decided")}
                  >
                    <CheckCircleIcon
                      className={`w-5 h-5 ${
                        filter === "Decided" ? "text-white" : "text-green-600"
                      } mr-2 text-green-600`}
                    />
                    {t("home.decidedRequests")}
                    <span
                      className={`ml-2 ${
                        filter === "Decided" ? "text-white" : "text-green-600"
                      }`}
                    >
                      ({decidedRequestsCount})
                    </span>
                  </a>

                  <a
                    className={` cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Rejected"
                        ? "text-white border bg-[#4475F2] rounded-md hover:text-white hover:bg-[#3e71f2]"
                        : "text-red-500 hover:text-red-500 hover:underline"
                    }  transition-all duration-300`}
                    onClick={() => handleFilterChange("Rejected")}
                  >
                    <CheckCircleIcon
                      className={`w-5 h-5 ${
                        filter === "Rejected" ? "text-white" : "text-red-500"
                      } mr-2`}
                    />
                    {t("home.rejectedRequests")}
                    <span
                      className={`ml-2 ${
                        filter === "Rejected" ? "text-white" : "text-red-500"
                      }`}
                    >
                      ({rejectedRequestsCount})
                    </span>
                  </a>
                </div>
                {/* <div className="flex justify-end items-center mb-1 pr-16">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={handleSortChange}
                  >
                    {sortOrder === "asc" ? (
                      <FaSortAmountUpAlt className="text-gray-500" />
                    ) : (
                      <FaSortAmountDown className="text-gray-500" />
                    )}
                    <span className="ml-2">Sort by Date</span>
                  </div>
                </div> */}
              </div>
              {/* <div className="w-full border-t border-gray-300 mt-4"></div> */}

              {!isExpanded &&
                (paginatedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <img
                      src="/jcds-applicant/img/Empty-amico.png"
                      alt="No Data Found"
                      className="w-64 h-64 mb-6"
                    />
                    <div className="text-2xl font-semibold text-gray-800 mb-2">
                      No Data Available
                    </div>
                    <div className="text-sm text-gray-500 mb-6">
                      There are no reports to display.
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${
                      paginatedRequests.length > 10
                        ? "flex flex-wrap"
                        : "flex flex-wrap mb-[300px]"
                    } `}
                  >
                    {paginatedRequests.map((request) => {
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
                        evidences,
                      } = request;

                      return (
                        <div
                          key={request_id}
                          className="w-full sm:w-1/2 lg:w-1/4 p-1"
                        >
                          <div
                            className="shadow-inherit rounded-lg hover:shadow-lg"
                            style={{
                              boxShadow: "0 4px 15px #3470FF40",
                            }}
                          >
                            {requestType === "disciplinary" ? (
                              <DisciplinaryCardHome
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
                              <StatisticsCardHome
                                icon={React.createElement(icon, {
                                  className: "w-6 h-6 text-blue-500",
                                })}
                                archives={archives}
                                applicantName={applicantNames}
                                applicantPhoneNumber={applicantPhoneNumber}
                                applicantRegions={applicantRegions}
                                applicantZones={applicantZones}
                                applicantWoredas={applicantWoredas}
                                applicantCity={applicantCity}
                                applicantSubCity={applicantSubCity}
                                status={status}
                                representative={representative_name}
                                respondentName={respondentNames}
                                requestDate={request_date}
                                request_id={request_id}
                                onDelete={handleDelete}
                                onPrint={handlePrint}
                                onDownload={handleDownload}
                                className="flex flex-col space-y-4 p-4 rounded-lg shadow-xl hover:shadow-2xl transition-shadow"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

              {!isExpanded && paginatedRequests && paginatedRequests.length > 0 && (
                <div className="flex flex-col items-center gap-4 mt-8">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">
                      Show rows:
                    </span>
                    <div className="relative">
                      <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {itemsPerPageOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      aria-label="Previous Page"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border ${
                        currentPage === 1
                          ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "text-blue-600 border-blue-200 bg-white hover:bg-blue-50"
                      } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1 text-sm text-gray-600">
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
                      className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md border ${
                        currentPage === totalPages
                          ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "text-blue-600 border-blue-200 bg-white hover:bg-blue-50"
                      } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

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
      />
      <ConfirmDialog
        open={openConfirmDialog}
        onClose={handleCloseDialog}
        onConfirm={() => handleConfirmDelete(requestId)}
        title={t("home.deleteTitle")}
        description={t("home.deleteDescription")}
      />
      
      {/* New Request Modal */}
      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={handleCloseNewRequestModal}
      />
    </div>
  );
}

export default Home;
