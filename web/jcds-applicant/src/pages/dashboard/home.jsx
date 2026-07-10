import { useLoading } from "@/LoadingContext";
import StatisticsCardApplicant from "@/widgets/cards/statistics-card-applicant";
import StatisticsCardComplaint from "@/widgets/cards/statistics-card-complaint";
import StatisticsCardRepresentative from "@/widgets/cards/statistics-card-representative";
import { StatisticsCardStatus } from "@/widgets/cards/statistics-card-status";
import { FaSortAmountDown, FaSortAmountUpAlt } from "react-icons/fa";

import customerAuthService from "@/service/customer-auth.service";
import {
  CheckCircleIcon,
  ClockIcon,
  InboxIcon,
  PlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import ConfirmDialog from "./deleteModal";
import LoadingPage from "./LoadingPage";

export function Home() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const customerAccountToken = localStorage.getItem("customerAccountToken");
  const [userProfile, setUserProfile] = useState(null);
  const itemsPerPageOptions = [5, 10, 20, 50, 100];
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
  const [approvedRequestsCount, setApprovedRequestsCount] = useState(0);
  const [rejectedRequestsCount, setRejectedRequestsCount] = useState(0);
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandLoadingState, setExpandLoadingState] = useState({});
  const [selectedRequestData, setSelectedRequestData] = useState();
  const handleFilterChange = (filterType) => {
    startLoading();
    setTimeout(() => {
      setFilter(filterType);
      updateURL(filterType, sortOrder, searchQuery, itemsPerPage, currentPage);
      stopLoading();
    }, 500);
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
      const data = await RequestService.getRequestByCustomerId(customerId, {
        filter,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage,
      });

      const requestsWithDocuments = await Promise.all(
        data.requests?.map(async (request) => {
          const documentStatusCount = await fetchDocumentStatusCount(
            request.request_id
          );
          const requestDocuments = await fetchDocuments(request.request_id);
          return {
            ...request,
            documents: requestDocuments,
            documentStatusCount,
          };
        })
      );
      setRequestsData(requestsWithDocuments);
      setAllRequestsCount(data.counts.all);
      setPendingRequestsCount(data.counts.pending);
      setTotalPages(data.pagination.totalPages);
      setApprovedRequestsCount(data.counts.approved);
      setRejectedRequestsCount(data.counts.rejected);
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

  const handleSortChange = () => {
    startLoading();
    setTimeout(() => {
      const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newSortOrder);
      updateURL(filter, newSortOrder, searchQuery, itemsPerPage, currentPage);
      stopLoading();
    }, 500);
  };

  const handleSearchChange = (event) => {
    const newSearchQuery = event.target.value;
    setSearchQuery(newSearchQuery);
    updateURL(filter, sortOrder, newSearchQuery, itemsPerPage, currentPage);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRequestsData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filter, sortOrder, currentPage, itemsPerPage, searchQuery, currentPage]);

  const sortedRequests = sortData(requestsData, sortOrder);

  return (
    <div>
      {loading ? (
        <LoadingPage />
      ) : requestsData && allRequestsCount === 0 ? (
        <div className="flex flex-col lg:flex-row items-center justify-center text-center lg:text-center">
          <div className="lg:w-1/4 flex flex-col items-center">
            <div class="flex flex-col items-center">
              <img
                src="/img/cci_logo.png"
                alt="Not Found"
                class="w-80 h-72 lg:w-80 lg:h-52 p-4"
              />

              <div class="text-center lg:text-center">
                <div class="text-2xl lg:text-5xl font-semibold text-blue-900 mb-6">
                  {t("home.noRequestFound")}
                </div>
                <div class="text-sm text-gray-500 mb-6">
                  {t("home.noRequestFoundDetail")}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={() => handleNavigation("/home/new-request")}
              >
                <PlusIcon className="w-5 h-5 mr-2 text-white" />
                {t("home.createRequest")}
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 mt-6 lg:mt-0 flex justify-center">
            <img
              src="/img/Empty-amico.png"
              alt="Side Image"
              className="w-80 h-80 lg:w-96 lg:h-96"
            />
          </div>
        </div>
      ) : (
        requestsData &&
        allRequestsCount >= 0 && (
          <div className="container mx-auto">
            <div className="flex items-center justify-between my-6 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-800 px-4">
                Welcome back,{" "}
                <span className="text-indigo-600">
                  {userProfile ? userProfile.full_name : null}
                </span>
                !
              </h2>

              <div className="flex items-center gap-4">
                {" "}
                <button
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={() => handleNavigation("/home/new-request")}
                >
                  <PlusIcon className="w-5 h-5 mr-2 text-white" />
                  {t("home.createRequest")}
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap">
                <div className="flex items-center flex-wrap">
                  <a
                    className={` cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "all"
                        ? "text-gray-900 underline"
                        : "text-gray-700"
                    } hover:text-gray-900 hover:underline transition-all duration-300`}
                    onClick={() => handleFilterChange("all")}
                  >
                    <InboxIcon className="w-5 h-5 text-gray-700 mr-2" />
                    {t("home.allRequests")}
                    <span className="ml-2 text-gray-500">
                      ({allRequestsCount})
                    </span>
                  </a>

                  <a
                    className={`cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Pending"
                        ? "text-yellow-800 underline"
                        : "text-yellow-600"
                    } hover:text-yellow-800 hover:underline transition-all duration-300`}
                    onClick={() => handleFilterChange("Pending")}
                  >
                    <ClockIcon className="w-5 h-5 text-yellow-600 mr-2" />
                    {t("home.pendingRequests")}
                    <span className="ml-2 text-yellow-500">
                      ({pendingRequestsCount})
                    </span>
                  </a>

                  <a
                    className={` cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Approved"
                        ? "text-green-800 underline"
                        : "text-green-600"
                    } hover:text-green-800 hover:underline transition-all duration-300`}
                    onClick={() => handleFilterChange("Approved")}
                  >
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                    {t("home.approvedRequests")}
                    <span className="ml-2 text-green-500">
                      ({approvedRequestsCount})
                    </span>
                  </a>

                  <a
                    className={`cursor-pointer flex items-center px-4 py-2 text-sm ${
                      filter === "Rejected"
                        ? "text-red-800 underline"
                        : "text-red-600"
                    } hover:text-red-800 hover:underline transition-all duration-300`}
                    onClick={() => handleFilterChange("Rejected")}
                  >
                    <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                    {t("home.rejectedRequests")}
                    <span className="ml-2 text-red-500">
                      ({rejectedRequestsCount})
                    </span>
                  </a>
                </div>
                <div className="flex justify-end items-center mb-1 pr-16">
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
                </div>
              </div>
              <div className="w-full border-t border-gray-300 mt-4"></div>

              {!isExpanded &&
                (sortedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <img
                      src="/img/Empty-amico.png"
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
                  sortedRequests
                    .slice(0, 9)
                    .map(
                      ({
                        icon,
                        applicantNames,
                        applicantRegions,
                        applicantZones,
                        applicantWoredas,
                        applicantCity,
                        applicantSubCity,
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
                      }) => (
                        <div
                          key={request_id}
                          className="flex flex-col sm:flex-row sm:flex-wrap md:flex-row h-full items-center"
                        >
                          <div
                            className="py-4"
                            style={{
                              overflowX: "auto",
                              scrollbarWidth: "none",
                              WebkitOverflowScrolling: "touch",
                            }}
                          >
                            <div className="flex space-x-4 min-w-max">
                              <div className="flex flex-col sm:flex-row sm:space-x-6 my-2 bg-blue-50 p-4 rounded-lg shadow-sm hover:shadow-sm transition-all  w-full sm:w-auto">
                                <StatisticsCardApplicant
                                  icon={React.createElement(icon, {
                                    className: "w-6 h-6 text-blue-500",
                                  })}
                                  applicantName={applicantNames}
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
                                  className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                                />
                                <StatisticsCardRepresentative
                                  icon={React.createElement(icon, {
                                    className: "w-6 h-6 text-blue-500",
                                  })}
                                  documents={requestDocuments}
                                  applicantName={applicantNames}
                                  status={status}
                                  representative={representative_name}
                                  phone={phone}
                                  phone_additional={phone_additional}
                                  gender={gender}
                                  respondentName={respondentNames}
                                  requestDate={request_date}
                                  request_id={request_id}
                                  onDelete={handleDelete}
                                  className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                                />

                                <StatisticsCardComplaint
                                  icon={React.createElement(icon, {
                                    className: "w-6 h-6 text-blue-500",
                                  })}
                                  documents={requestDocuments}
                                  applicantName={applicantNames}
                                  status={status}
                                  representative={representative_name}
                                  respondentName={respondentNames}
                                  requestDate={request_date}
                                  request_id={request_id}
                                  onDelete={handleDelete}
                                  onExpand={handleExpandToggle}
                                  expandLoading={expandLoadingState[request_id]}
                                  className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                                />
                                <StatisticsCardStatus
                                  icon={React.createElement(icon, {
                                    className: "w-6 h-6 text-blue-500",
                                  })}
                                  applicantName={applicantNames}
                                  status={status}
                                  representative={representative_name}
                                  respondentName={respondentNames}
                                  requestDate={request_date}
                                  request_id={request_id}
                                  onDelete={handleDelete}
                                  documentStatusCount={documentStatusCount}
                                  className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )
                ))}

              {!isExpanded && sortedRequests && sortedRequests.length > 0 && (
                <div className="flex flex-col items-center space-y-4 mt-8">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-800">
                      Items per page:
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="bg-white border border-gray-300 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {itemsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center items-center space-x-8">
                    <button
                      aria-label="Previous Page"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-blue-600 underline p-1 px-6 rounded-lg disabled:opacity-50 transition duration-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="font-medium">Prev</span>
                    </button>

                    <span className="text-sm md:text-l text-gray-800">
                      <span className="font-semibold text-blue-600">
                        Page {currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-blue-600">
                        {totalPages}
                      </span>
                    </span>

                    <button
                      aria-label="Next Page"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-blue-600 underline p-1 px-6 rounded-lg disabled:opacity-50 transition duration-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="font-medium">Next</span>
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
    </div>
  );
}

export default Home;
