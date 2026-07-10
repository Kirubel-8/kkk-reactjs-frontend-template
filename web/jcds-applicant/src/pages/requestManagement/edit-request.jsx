import { useMaterialTailwindController } from "@/context";
import { useLoading } from "@/loading-context";
import CaseType from "@/service/caseType.service";
import regionService from "@/service/region.service";
import requestService from "@/service/request.service";
import requestedFileService from "@/service/requested-file.service";
import woredaService from "@/service/woreda.service";
import zoneService from "@/service/zone.service";
import { ArrowLeftIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { Button, Input, Typography } from "@material-tailwind/react";
import { Box, Step, StepButton, Stepper } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SimpleReactValidator from "simple-react-validator";
import EditDocumentPreviewModal from "./edit-document-preview-modal";
import LivePreview from "./live-preview";

export function EditRequestForm() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { state } = useLocation();
  const request_id = state?.fullRequestId;
  const [activeStep, setActiveStep] = useState(0);
  const [isFirstStep, setIsFirstStep] = useState(false);
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeGender, setRepresentativeGender] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");
  const [representativePhoneAdditional, setRepresentativePhoneAdditional] =
    useState("");
  const [regions, setRegions] = useState([]);
  const { startLoading, stopLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [idTypes, setIdTypes] = useState([]);
  const [citySelected, setCitySelected] = useState(true);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [caseTypeId, setCaseTypeId] = useState("");
  const [selectedIdTypes, setSelectedIdTypes] = useState("");
  const [caseTypes, setCaseTypes] = useState([]);
  const [sameAsApplicant, setSameAsApplicant] = useState(false);
  const [applicantIdFrontFile, setApplicantIdFrontFile] = useState(null);
  const [applicantIdBackFile, setApplicantIdBackFile] = useState(null);

  const [validator] = useState(
    new SimpleReactValidator({
      autoForceUpdate: this,
      className: "text-red-500 text-xs mt-1",
    })
  );
  const [representativeIdBackFile, setRepresentativeIdBackFile] =
    useState(null);
  const [applicants, setApplicants] = useState([
    {
      name: "",
      region: "",
      woreda: "",
      zone: "",
      phone: "",
      otherAddress: "",
    },
  ]);
  const [respondents, setRespondents] = useState([
    {
      name: "",
      region: "",
      woreda: "",
      zone: "",
      phone: "",
      otherAddress: "",
    },
  ]);

  const [respondentZones, setRespondentZones] = useState(
    respondents.map(() => [])
  );
  const [respondentWoredas, setRespondentWoredas] = useState(
    respondents.map(() => [])
  );
  const [violatedConstitutionArticle, setViolatedConstitutionArticle] =
    useState("");
  const [affairDescription, setAffairDescription] = useState("");
  const [courtCaseResultReference, setCourtCaseResultReference] = useState("");
  const [otherApplicableLaws, setOtherApplicableLaws] = useState("");
  const [constitutionalComplaintSummary, setConstitutionalComplaintSummary] =
    useState("");
  const [files, setFiles] = useState([]);
  const [requestsData, setRequestsData] = useState({});
  const [representativeIdFile, setRepresentativeIdFile] = useState(null);
  const [representationLetterFile, setRepresentationLetterFile] =
    useState(null);
  const [complaintDocumentFiles, setComplaintDocumentFiles] = useState([]);
  const [completed, setCompleted] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [requestedFiles, setRequestedFiles] = useState([]);
  const [caseId, setCaseId] = useState(null);
  const [removedDocumentIds, setRemovedDocumentIds] = useState([]);

  const totalSteps = () => {
    return steps.length;
  };

  const completedSteps = () => {
    return Object.keys(completed).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? steps.findIndex((step, i) => !(i in completed))
        : activeStep + 1;
    setActiveStep(newActiveStep);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const validateFile = (file) => {
    if (!file) return false;

    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  };

  const handleComplete = () => {
    setCompleted({
      ...completed,
      [activeStep]: true,
    });
    handleNext();
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
  };

  const steps = [
    "Applicants Information",
    "Representative Information",
    "Respondents Information",
    "Complaints",
    "Attach Documents",
    "Review",
  ];

  const onDropHandler = useCallback((acceptedFiles, type) => {
    if (type === "complaintDocument") {
      acceptedFiles.forEach((file) => {
        setFiles((prevFiles) => [...prevFiles, { file, type }]);
        setComplaintDocumentFiles((prevFiles) => [...prevFiles, file]);
      });
    } else {
      const file = acceptedFiles[0];

      setFiles((prevFiles) =>
        prevFiles.filter((item) => item.type !== type).concat({ file, type })
      );

      if (type === "representativeId") {
        setRepresentativeIdFile(file);
      } else if (type === "representativeIdBack") {
        setRepresentativeIdBackFile(file);
      } else if (type === "representationLetter") {
        setRepresentationLetterFile(file);
      } else if (type === "applicantIdFront") {
        setApplicantIdFrontFile(file);
      } else if (type === "applicantIdBack") {
        setApplicantIdBackFile(file);
      }
    }
  }, []);

  const {
    getRootProps: getRootPropsApplicantFront,
    getInputProps: getInputPropsApplicantFront,
  } = useDropzone({
    onDrop: (acceptedFiles) => onDropHandler(acceptedFiles, "applicantIdFront"),
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  });

  const {
    getRootProps: getRootPropsApplicantBack,
    getInputProps: getInputPropsApplicantBack,
  } = useDropzone({
    onDrop: (acceptedFiles) => onDropHandler(acceptedFiles, "applicantIdBack"),
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  });

  const { getRootProps: getRootPropsId, getInputProps: getInputPropsId } =
    useDropzone({
      onDrop: (acceptedFiles) =>
        onDropHandler(acceptedFiles, "representativeId"),
      multiple: false,
      accept: {
        "application/pdf": [".pdf"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
      },
    });

  const {
    getRootProps: getRootPropsIdBack,
    getInputProps: getInputPropsIdBack,
  } = useDropzone({
    onDrop: (acceptedFiles) =>
      onDropHandler(acceptedFiles, "representativeIdBack"),
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  });

  const {
    getRootProps: getRootPropsLetter,
    getInputProps: getInputPropsLetter,
  } = useDropzone({
    onDrop: (acceptedFiles) =>
      onDropHandler(acceptedFiles, "representationLetter"),
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  });

  const {
    getRootProps: getRootPropsComplaint,
    getInputProps: getInputPropsComplaint,
  } = useDropzone({
    onDrop: (acceptedFiles) =>
      onDropHandler(acceptedFiles, "complaintDocument"),
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  });

  const handleFileRemoval = (fileIdentifier, type) => {
    if (type === "complaintDocument") {
      const databaseFile = documents.find(
        (doc) =>
          doc.request_document_id === fileIdentifier ||
          doc.replaceDocumentId === fileIdentifier
      );

      if (databaseFile && !removedDocumentIds.includes(fileIdentifier)) {
        setRemovedDocumentIds((prev) => [...prev, fileIdentifier]);
      }
    }

    setFiles((prevFiles) => {
      return prevFiles.filter((file) => {
        if (file.file.request_document_id) {
          return file.file.request_document_id !== fileIdentifier;
        }
        return file.file.name !== fileIdentifier;
      });
    });

    switch (type) {
      case "representativeId":
        setRepresentativeIdFile(null);
        break;
      case "representativeIdBack":
        setRepresentativeIdBackFile(null);
        break;
      case "representationLetter":
        setRepresentationLetterFile(null);
        break;
      case "complaintDocument":
        setComplaintDocumentFiles((prevFiles) => {
          return prevFiles.filter((file) => {
            if (file.request_document_id) {
              return file.request_document_id !== fileIdentifier;
            }
            return file.name !== fileIdentifier;
          });
        });
        break;
      case "applicantIdFront":
        setApplicantIdFrontFile(null);
        break;
      case "applicantIdBack":
        setApplicantIdBackFile(null);
        break;
      default:
        break;
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setSameAsApplicant(checked);

    if (checked) {
      setRepresentativeName(applicants[0].name || "");
      setRepresentativePhone(applicants[0].phone || "");
    } else {
      setRepresentativeName("");
      setRepresentativePhone("");
    }
  };

  const handleAddApplicant = () => {
    setApplicants([
      ...applicants,
      {
        name: "",
        region: "",
        woreda: "",
        zone: "",
        phone: "",
        otherAddress: "",
      },
    ]);
  };

  const handleAddRespondent = () => {
    setRespondents([
      ...respondents,
      {
        name: "",
        region: "",
        woreda: "",
        zone: "",
        phone: "",
        otherAddress: "",
      },
    ]);
  };

  const handleRemoveRespondent = (index) => {
    if (respondents.length > 1) {
      setRespondents(respondents.filter((_, i) => i !== index));
      setRespondentZones(respondentZones.filter((_, i) => i !== index));
      setRespondentWoredas(respondentWoredas.filter((_, i) => i !== index));

      const fields = [`respondent_zone_${index}`, `respondent_woreda_${index}`];
      fields.forEach((field) => validator.hideMessageFor(field));
      validator.forceUpdate();
    }
  };

  const handleInputChange = (index, field, value, type) => {
    const updatedData =
      type === "applicant" ? [...applicants] : [...respondents];
    updatedData[index][field] = value;
    type === "applicant"
      ? setApplicants(updatedData)
      : setRespondents(updatedData);
  };

  useEffect(() => {
    const fetchRequestsData = async () => {
      try {
        setLoading(true);
        startLoading();
        const data = await requestService.getRequestById(request_id);
        console.log("Fetched request data:", data);

        const request = data;
        const documentStatusCount = await fetchDocumentStatusCount(
          request.request_id
        );
        const requestDocuments = await fetchDocuments(request.request_id);
        console.log("All fetched request documents:", requestDocuments);
        const applicantDocuments = requestDocuments.filter(
          (doc) =>
            doc.document_type === "id_file_front_url" ||
            doc.document_type === "id_file_back_url"
        );
        console.log("Applicant documents:", applicantDocuments);

        setApplicantIdFrontFile(
          applicantDocuments.find(
            (doc) => doc.document_type === "id_file_front_url"
          )
        );
        setApplicantIdBackFile(
          applicantDocuments.find(
            (doc) => doc.document_type === "id_file_back_url"
          )
        );
        const complaintDocuments = requestDocuments.filter(
          (document) => document.document_type === "complaint document"
        );
        setComplaintDocumentFiles(complaintDocuments);
        const representativeDocuments = requestDocuments.filter(
          (document) => document.document_type !== "complaint document"
        );
        const idDocuments = representativeDocuments.filter(
          (doc) => doc.document_type === "id"
        );
        if (idDocuments.length > 0) {
          setRepresentativeIdFile(idDocuments[0]);
        }
        if (idDocuments.length > 1) {
          setRepresentativeIdBackFile(idDocuments[1]);
        }

        const letterDoc = representativeDocuments.find(
          (doc) => doc.document_type === "representation letter"
        );
        if (letterDoc) {
          setRepresentationLetterFile(letterDoc);
        }
        if (request.applicants && request.applicants.length > 0) {
          const formattedApplicants = request.applicants.map((applicant) => ({
            name: applicant.applicant_name || applicant.applicantNames || "",
            phone:
              applicant.phone_number || applicant.applicantPhoneNumber || "",
            region:
              applicant.applicant_region_id ||
              applicant.applicant_city_id ||
              "",
            zone:
              applicant.applicant_zone_id ||
              applicant.applicant_subcity_id ||
              "",
            woreda: applicant.applicant_woreda_id || "",
            otherAddress: applicant.address,
          }));
          setApplicants(formattedApplicants);
        }

        if (request.respondents && request.respondents.length > 0) {
          const formattedRespondents = request.respondents.map((respondent) => {
            const regionValue =
              typeof respondent.region === "object"
                ? respondent?.region?.region_id
                : respondent?.region || respondent?.respondentRegions || "";

            const cityValue =
              typeof respondent.city === "object"
                ? respondent?.city?.city_id
                : respondent?.city || respondent?.respondentCities || "";

            const zoneValue =
              typeof respondent.zone === "object"
                ? respondent?.zone?.zone_id
                : respondent?.zone || respondent?.respondentZones || "";

            const subCityValue =
              typeof respondent.subcity === "object"
                ? respondent?.subcity?.subcity_id
                : respondent?.subcity || "";

            const woredaValue =
              typeof respondent.woreda === "object"
                ? respondent?.woreda?.woreda_id
                : respondent?.woreda || respondent?.respondentWoredas || "";

            return {
              name: respondent?.respondent_name || "",
              phone: respondent?.phone_number || "",
              region: regionValue ? regionValue : cityValue,
              zone: zoneValue ? zoneValue : subCityValue,
              woreda: woredaValue,
              otherAddress: respondent?.address || "",
            };
          });
          setRespondents(formattedRespondents);
          const initialZones = request.respondents.map(() => []);
          const initialWoredas = request.respondents.map(() => []);
          setRespondentZones(initialZones);
          setRespondentWoredas(initialWoredas);
        }
        setRepresentativeName(request.representative_name || "");
        setRepresentativeGender(request.gender || "");
        setRepresentativePhone(request.phone || "");
        setRepresentativePhoneAdditional(request.phone_additional || "");
        setViolatedConstitutionArticle(
          request.violated_constitution_article || ""
        );
        setAffairDescription(request.affair_description || "");
        setCourtCaseResultReference(request.court_case_result_reference || "");
        setOtherApplicableLaws(request.other_applicable_laws || "");
        setConstitutionalComplaintSummary(
          request.constitutional_complaint_summary || ""
        );
        setCaseTypeId(request?.case_type_id || "");
        if (request?.id_type) {
          setSelectedIdTypes(request?.id_type);
        } else {
          setSelectedIdTypes("");
        }
        const enrichedRequest = {
          ...request,
          documents: complaintDocuments,
          representativeDocuments: representativeDocuments,
          documentStatusCount,
        };

        setRequestsData(enrichedRequest);
        if (data.archives && data.archives.length > 0) {
          const caseId = data.archives[0].caseId;
          setCaseId(caseId);
        }
        setTimeout(() => {
          setLoading(false);
        }, 3000);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        stopLoading();
      } catch (error) {
        console.error("Error fetching request data:", error);
        stopLoading();
      } finally {
        stopLoading();
      }
    };
    fetchRequestsData();

    const fetchDocuments = async () => {
      try {
        const response = await requestService.getRequestDocuments(request_id);
        console.log("Raw response from getRequestDocuments:", response);
        setDocuments(response.documents);
        return response.documents;
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchRequestedFiles = async () => {
      try {
        const files = await requestedFileService.getRequestedFiles(request_id);
        setRequestedFiles(files.documents);
      } catch (error) {
        console.error("Error fetching requested documents:", error);
      }
    };

    if (request_id) {
      fetchDocuments();
      fetchRequestedFiles();
    }
  }, [request_id]);

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

  useEffect(() => {
    const fetchZones = async () => {
      const zonesPromises = respondents.map(async (respondent) => {
        if (respondent.region) {
          try {
            const response = await zoneService.getZonesByRegionId(
              respondent.region
            );
            return response || [];
          } catch (error) {
            console.error("Failed to fetch zones:", error);
            return [];
          }
        }
        return [];
      });

      Promise.all(zonesPromises).then((zones) => {
        setRespondentZones(zones);
      });
    };

    fetchZones();
  }, [respondents.map((r) => r.region).join(",")]);

  useEffect(() => {
    const fetchWoredas = async () => {
      const woredasPromises = respondents.map(async (respondent) => {
        if (respondent.zone) {
          try {
            const response = await woredaService.getWoredasByZoneId(
              respondent.zone
            );
            return response || [];
          } catch (error) {
            console.error("Failed to fetch woredas:", error);
            return [];
          }
        }
        return [];
      });

      Promise.all(woredasPromises).then((woredas) => {
        setRespondentWoredas(woredas);
      });
    };

    fetchWoredas();
  }, [respondents.map((r) => r.zone).join(",")]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await regionService.getAllRegion();
        setRegions(response.locations || []);
      } catch (error) {
        toast.error("Failed to fetch regions.", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
      }
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchIdType = async () => {
      try {
        const response = await regionService.getAllIdTypes();
        setIdTypes(response || []);
      } catch (error) {
        toast.error("Failed to fetch id types.", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
      }
    };

    fetchIdType();
  }, []);

  useEffect(() => {
    const fetchZones = async () => {
      if (applicants.some((applicant) => applicant.region)) {
        const selectedRegion = applicants.find(
          (applicant) => applicant.region
        ).region;
        try {
          const response = await zoneService.getZonesByRegionId(selectedRegion);
          setZones(response || []);
        } catch (error) {
          toast.error("Failed to fetch zones for the selected region.", {
            position: "top-right",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
            transition: Zoom,
          });
        }
      }
    };

    fetchZones();
  }, [applicants.map((applicant) => applicant.region).join(",")]);

  useEffect(() => {
    const fetchWoredas = async () => {
      if (applicants.some((applicant) => applicant.zone)) {
        const selectedZone = applicants.find(
          (applicant) => applicant.zone
        ).zone;
        try {
          const response = await woredaService.getWoredasByZoneId(selectedZone);
          setWoredas(response || []);
        } catch (error) {
          toast.error(error.message, {
            position: "top-right",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
            transition: Zoom,
          });
        }
      }
    };

    fetchWoredas();
  }, [applicants.map((applicant) => applicant.zone).join(",")]);

  useEffect(() => {
    const fetchCaseTypes = async () => {
      try {
        const caseTypeData = await CaseType.getAllCaseTypes();
        setCaseTypes(caseTypeData);
      } catch (error) {
        toast.error("Failed to fetch case types.", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
      }
    };

    fetchCaseTypes();
  }, []);

  const getRegionName = (regionId) => {
    const region = regions.find((region) => region.id === regionId);
    return region ? region.name : regionId;
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(
      (zone) => zone.subcity_id || zone.zone_id === zoneId
    );
    return zone ? zone.name : zoneId;
  };

  const getWoredaName = (woredaId) => {
    const woreda = woredas.find((woreda) => woreda.woreda_id === woredaId);
    return woreda ? woreda.name : woredaId;
  };

  const getRespondentZoneName = (zoneId, respondentIndex) => {
    if (!respondentZones[respondentIndex]) return zoneId;
    const zone = respondentZones[respondentIndex].find(
      (zone) => zone.subcity_id === zoneId || zone.zone_id === zoneId
    );
    return zone ? zone.name : zoneId;
  };

  const getRespondentWoredaName = (woredaId, respondentIndex) => {
    if (!respondentWoredas[respondentIndex]) return woredaId;

    const woreda = respondentWoredas[respondentIndex].find(
      (woreda) => woreda.woreda_id === woredaId
    );
    return woreda ? woreda.name : woredaId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
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

      const newDocuments = [];
      const documentsToReplace = [...removedDocumentIds];

      if (representativeIdFile) {
        if (!representativeIdFile.request_document_id) {
          newDocuments.push({
            file: representativeIdFile,
            type: "representativeId",
          });
        }
      }

      if (representativeIdBackFile) {
        if (!representativeIdBackFile.request_document_id) {
          newDocuments.push({
            file: representativeIdBackFile,
            type: "representativeIdBack",
          });
        }
      }

      if (representationLetterFile) {
        if (!representationLetterFile.request_document_id) {
          newDocuments.push({
            file: representationLetterFile,
            type: "representationLetter",
          });
        }
      }

      if (applicantIdFrontFile && !applicantIdFrontFile.request_document_id) {
        newDocuments.push({
          file: applicantIdFrontFile,
          type: "applicantIdFront",
        });
      }

      if (applicantIdBackFile && !applicantIdBackFile.request_document_id) {
        newDocuments.push({
          file: applicantIdBackFile,
          type: "applicantIdBack",
        });
      }

      const existingComplaints = files.filter(
        (f) => f.type === "complaintDocument" && f.file.request_document_id
      );

      existingComplaints.forEach((existingDoc) => {
        const stillExists = complaintDocumentFiles.some(
          (newDoc) =>
            newDoc.request_document_id === existingDoc.file.request_document_id
        );
        if (!stillExists) {
          documentsToReplace.push(existingDoc.file.request_document_id);
        }
      });

      complaintDocumentFiles.forEach((file) => {
        if (!file.request_document_id) {
          newDocuments.push({
            file,
            type: "complaintDocument",
          });
        }
      });

      const requestData = {
        representative_name: representativeName,
        gender: representativeGender,
        phone: representativePhone,
        phone_additional: representativePhoneAdditional,
        id_type: selectedIdTypes,
        applicants,
        respondents,
        violated_constitution_article: violatedConstitutionArticle,
        affair_description: affairDescription,
        other_applicable_laws: otherApplicableLaws,
        constitutional_complaint_summary: constitutionalComplaintSummary,
        court_case_result_reference: courtCaseResultReference,
        documents: newDocuments,
        documentsToReplace,
        customer_id: customerId,
        case_type_id: caseTypeId,
      };
      console.log("Request data to be sent:", requestData);

      const response = await requestService.updateRequest(
        request_id,
        requestData
      );
      toast.success("Request updated successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        transition: Zoom,
      });
      setTimeout(() => {
        navigate("/home/requests");
      }, 2500);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "There was an error updating the request.",
        {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        }
      );
    }
  };

  return (
    <section className="mx-auto px-4 py-1 lg:py-2">
      <div className="flex items-center gap-8 mb-4">
        <NavLink to={`/home/requests`}>
          <Button variant="outlined" className="flex items-center gap-2">
            <ArrowLeftIcon className="h-3 w-3 text-gray-600" />
          </Button>
        </NavLink>

        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            F.D.R.E Council Of Constitutional Inquiry Application Form
          </h1>
          <h2 className="text-l font-extralight text-gray-600">
            Step-by-Step Guide: Fill out the Form with Caution
          </h2>
        </div>
      </div>

      <hr className="border-t-2 border-gray-300 mt-10" />
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

      <div className="w-full mx-auto  flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8 py-8">
        <div className="pr-6">
          <h3 className="text-xl font-semibold mb-4">Steps</h3>
          <Stepper
            activeStep={activeStep}
            onChange={(_, newStep) => setActiveStep(newStep)}
            orientation="vertical"
            className="pb-10"
          >
            {steps.map((label, index) => (
              <Step key={index}>
                <StepButton
                  color="inherit"
                  onClick={handleStep(index)}
                  className="text-gray-800 hover:text-blue-600 transition-colors"
                >
                  {label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </div>

        <div className="w-full md:w-2/3 border-l-2">
          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <div className=" w-full  px-9 rounded-md">
                <div className=" overflow-y-auto scrollbar-hide touch-pan-y">
                  <div className="flex justify-between items-center mb-4">
                    <div className="mb-8">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-700"
                      >
                        Applicants Details
                      </Typography>

                      <Typography
                        variant="body1"
                        className="text-gray-600 mt-2"
                      >
                        Here are the applicant's personal details provided in
                        relation to the complaint request.
                      </Typography>
                    </div>
                  </div>

                  {applicants.map((applicant, index) => (
                    <div
                      key={index}
                      className="space-y-6 w-full border-b-2 border-gray-300 pb-6 mb-6"
                    >
                      <div className="space-y-6 w-full">
                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Full Name <span className="text-red-500">*</span>
                            </Typography>
                            <Input
                              placeholder="Applicant's full name"
                              name="applicant_name"
                              value={applicant.name}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "name",
                                  e.target.value,
                                  "applicant"
                                );
                                validator.showMessageFor("applicant_name");
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                            />
                            {validator.message(
                              "applicant_name",
                              applicant.name,
                              "required|alpha_space|min:3",
                              {
                                messages: {
                                  required: "Full name is required",
                                  alpha_space:
                                    "Name should contain only letters and spaces",
                                  min: "Name should be at least 3 characters",
                                },
                              }
                            )}
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Phone Number{" "}
                              <span className="text-red-500">*</span>
                            </Typography>

                            <div className="relative">
                              <Input
                                placeholder="*********"
                                name="applicant_phone"
                                value={applicant.phone.replace(/^\+251/, "")}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  const formattedValue = rawValue.slice(0, 9);
                                  const fullPhone = `+251${formattedValue}`;
                                  handleInputChange(
                                    index,
                                    "phone",
                                    fullPhone,
                                    "applicant"
                                  );

                                  validator.showMessageFor("applicant_phone");
                                }}
                                className={`pl-16 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm ${
                                  validator.errorMessages.applicant_phone
                                    ? "border-red-500"
                                    : ""
                                }`}
                                maxLength={9}
                              />
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-gray-700">
                                +251
                              </span>
                            </div>

                            {/* Validation Message */}
                            {validator.message(
                              "applicant_phone",
                              applicant.phone,
                              "required|regex:^\\+251[1-9][0-9]{8}$",
                              {
                                messages: {
                                  required: "Phone number is required",
                                  regex:
                                    "Must be a valid Ethiopian number (e.g., +251912345678)",
                                },
                              }
                            )}
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Region / City Administration{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="applicant_region"
                              value={applicant.region}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "region",
                                  e.target.value,
                                  "applicant"
                                )
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                            >
                              <option value="">Select Applicant Region</option>
                              {regions.map((region) => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Zone / Sub city{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="applicant_zone"
                              value={applicant.zone}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "zone",
                                  e.target.value,
                                  "applicant"
                                )
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                              disabled={!applicant.region}
                            >
                              <option value="">Select Applicant Zone</option>
                              {zones.map((zone) => (
                                <option
                                  key={zone.zone_id || zone.subcity_id}
                                  value={zone.zone_id || zone.subcity_id}
                                >
                                  {zone.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Woreda <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="applicant_woreda"
                              value={applicant.woreda}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "woreda",
                                  e.target.value,
                                  "applicant"
                                )
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                              disabled={!applicant.region}
                            >
                              <option value="">Select Applicant Woreda</option>
                              {woredas.map((woreda) => (
                                <option
                                  key={woreda.woreda_id}
                                  value={woreda.woreda_id}
                                >
                                  {woreda.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Other Address (City, Kebele, etc.)
                            </Typography>
                            <Input
                              placeholder="Other address (if any)"
                              name="applicant_address"
                              value={applicant.otherAddress}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "otherAddress",
                                  e.target.value,
                                  "applicant"
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row mt-6 space-x-0 md:space-x-6 space-y-6 md:space-y-0">
                          {/* Applicant ID Front */}
                          <div className="w-full space-y-4">
                            <div className="border-b-2 border-gray-200 pb-4 mb-4">
                              <h3 className="text-base font-medium text-gray-800">
                                Applicant ID Front{" "}
                                <span className="text-gray-500 text-sm">
                                  (optional)
                                </span>
                              </h3>
                              <div
                                {...getRootPropsApplicantFront()}
                                className="border-2 border-dashed border-gray-300 p-5 text-center rounded-md cursor-pointer"
                                onClick={() =>
                                  document
                                    .getElementById("applicant_id_front_input")
                                    ?.click()
                                }
                              >
                                <input
                                  {...getInputPropsApplicantFront({
                                    accept: ".pdf,.png,.jpg,.jpeg",
                                    onChange: (e) => {
                                      const file = e.target.files[0];
                                      if (file && validateFile(file)) {
                                        if (
                                          applicantIdFrontFile &&
                                          applicantIdFrontFile.request_document_id
                                        ) {
                                          const newFile = Object.assign(file, {
                                            replaceDocumentId:
                                              applicantIdFrontFile.request_document_id,
                                          });
                                          setApplicantIdFrontFile(newFile);
                                        } else {
                                          setApplicantIdFrontFile(file);
                                        }
                                      }
                                    },
                                  })}
                                  id="applicant_id_front_input"
                                  style={{ display: "none" }}
                                />
                                <p className="text-sm text-gray-500">
                                  Click or drag to upload front side
                                </p>
                              </div>
                              {applicantIdFrontFile && (
                                <div className="mt-2">
                                  <div className="flex items-center">
                                    <span
                                      onClick={(e) => {
                                        setPreviewFile(applicantIdFrontFile);
                                        setIsPreviewModalOpen(true);
                                        e.stopPropagation();
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                    >
                                      {applicantIdFrontFile.name ||
                                        "Applicant ID Front"}
                                    </span>

                                    <span className="text-xs text-gray-500 ml-2">
                                      {applicantIdFrontFile.size
                                        ? `(${(
                                            applicantIdFrontFile.size /
                                            (1024 * 1024)
                                          ).toFixed(2)} MB)`
                                        : ""}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleFileRemoval(
                                          applicantIdFrontFile.name ||
                                            applicantIdFrontFile.request_document_id,
                                          "applicantIdFront"
                                        )
                                      }
                                      className="text-indigo-800 mx-3 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Applicant ID Back */}
                          <div className="w-full space-y-4">
                            <div className="border-b-2 border-gray-200 pb-4 mb-4">
                              <h3 className="text-base font-medium text-gray-800">
                                Applicant ID Back{" "}
                                <span className="text-gray-500 text-sm">
                                  (optional)
                                </span>
                              </h3>
                              <div
                                {...getRootPropsApplicantBack()}
                                className="border-2 border-dashed border-gray-300 p-5 text-center rounded-md cursor-pointer"
                                onClick={() =>
                                  document
                                    .getElementById("applicant_id_back_input")
                                    ?.click()
                                }
                              >
                                <input
                                  {...getInputPropsApplicantBack({
                                    accept: ".pdf,.png,.jpg,.jpeg",
                                    onChange: (e) => {
                                      const file = e.target.files[0];
                                      if (file && validateFile(file)) {
                                        if (
                                          applicantIdBackFile &&
                                          applicantIdBackFile.request_document_id
                                        ) {
                                          const newFile = Object.assign(file, {
                                            replaceDocumentId:
                                              applicantIdBackFile.request_document_id,
                                          });
                                          representativeIdBackFile(newFile);
                                        } else {
                                          representativeIdBackFile(file);
                                        }
                                      }
                                    },
                                  })}
                                  id="applicant_id_back_input"
                                  style={{ display: "none" }}
                                />
                                <p className="text-sm text-gray-500">
                                  Click or drag to upload back side
                                </p>
                              </div>
                              {applicantIdBackFile && (
                                <div className="mt-2">
                                  <div className="flex items-center">
                                    <span
                                      onClick={(e) => {
                                        setPreviewFile(applicantIdBackFile);
                                        setIsPreviewModalOpen(true);
                                        e.stopPropagation();
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                    >
                                      {applicantIdBackFile.name ||
                                        "Applicant ID Back"}
                                    </span>

                                    <span className="text-xs text-gray-500 ml-2">
                                      {applicantIdBackFile.size
                                        ? `(${(
                                            applicantIdBackFile.size /
                                            (1024 * 1024)
                                          ).toFixed(2)} MB)`
                                        : ""}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleFileRemoval(
                                          applicantIdBackFile.name ||
                                            applicantIdBackFile.request_document_id,
                                          "applicantIdBack"
                                        )
                                      }
                                      className="text-indigo-800 mx-3 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeStep === 1 && (
              <div className="w-full px-9 rounded-md">
                <div className=" overflow-y-auto scrollbar-hide touch-pan-y">
                  <div className="flex justify-between items-center mb-4">
                    <div className="mb-8">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-700"
                      >
                        Representative Details
                      </Typography>
                      <Typography
                        variant="body1"
                        className="text-gray-600 mt-2"
                      >
                        Here are the details of the representative information
                      </Typography>
                      {/* <div className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          id="sameAsApplicant"
                          className="mr-2"
                          checked={sameAsApplicant}
                          onChange={handleCheckboxChange}
                        />
                        <label
                          htmlFor="sameAsApplicant"
                          className="text-gray-700 text-sm"
                        >
                          I am the representative
                        </label>
                      </div> */}
                    </div>
                  </div>

                  <div className="border-b-2 border-gray-300 pb-6 mb-6 grid grid-cols-1 gap-6 w-full">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-900"
                          >
                            Name <span className="text-red-500">*</span>
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            value={representativeName}
                            placeholder="Representative's name"
                            name="representative_name"
                            className={`w-full px-4 py-3 border ${
                              validator.errorMessages.representative_name
                                ? "border-red-500"
                                : "border-blue-200"
                            } rounded-md shadow-sm placeholder:text-blue-gray-300`}
                            onChange={(e) => {
                              setRepresentativeName(e.target.value);
                              validator.showMessageFor("representative_name");
                            }}
                            containerProps={{ className: "min-w-full" }}
                          />
                          {/* Validation message */}
                          {validator.message(
                            "representative_name",
                            representativeName,
                            "required|alpha_space|min:3|max:50",
                            {
                              messages: {
                                required: "Representative name is required",
                                alpha_space:
                                  "Name should contain only letters and spaces",
                                min: "Name should be at least 3 characters",
                                max: "Name should not exceed 50 characters",
                              },
                              className: "text-red-500 text-xs mt-1",
                            }
                          )}
                        </div>

                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-900"
                          >
                            Phone Number <span className="text-red-500">*</span>
                          </Typography>

                          <div className="relative">
                            <Input
                              color="gray"
                              size="lg"
                              placeholder="*********"
                              name="representative_phone"
                              value={representativePhone.replace(/^\+251/, "")}
                              className={`pl-16 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm ${
                                validator.errorMessages.representative_phone
                                  ? "border-red-500"
                                  : "border-blue-200"
                              } `}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 9);
                                const formattedPhone = `+251${digits}`;
                                setRepresentativePhone(formattedPhone);
                                validator.showMessageFor(
                                  "representative_phone"
                                );
                              }}
                              containerProps={{ className: "min-w-full" }}
                              maxLength={9}
                            />
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-gray-700">
                              +251
                            </span>
                          </div>

                          {/* Validation message */}
                          {validator.message(
                            "representative_phone",
                            representativePhone,
                            "required|regex:^\\+251[1-9][0-9]{8}$",
                            {
                              messages: {
                                required: "Phone number is required",
                                regex:
                                  "Must be a valid Ethiopian number (e.g., +251912345678)",
                              },
                              className: "text-red-500 text-xs mt-1",
                            }
                          )}
                        </div>

                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-900"
                          >
                            Additional Phone Number
                          </Typography>

                          <div className="relative">
                            <Input
                              color="gray"
                              size="lg"
                              placeholder="*********"
                              name="representative_phone_additional"
                              value={representativePhoneAdditional.replace(
                                /^\+251/,
                                ""
                              )}
                              className={`pl-16 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm ${
                                representativePhoneAdditional &&
                                validator.errorMessages
                                  .representative_phone_additional
                                  ? "border-red-500"
                                  : "border-blue-200"
                              } `}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 9);
                                const formattedPhone = digits
                                  ? `+251${digits}`
                                  : "";
                                setRepresentativePhoneAdditional(
                                  formattedPhone
                                );
                                if (formattedPhone) {
                                  validator.showMessageFor(
                                    "representative_phone_additional"
                                  );
                                }
                              }}
                              containerProps={{ className: "min-w-full" }}
                              maxLength={9}
                            />
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-gray-700">
                              +251
                            </span>
                          </div>

                          {/* Validation message (only shows if field has value) */}
                          {representativePhoneAdditional &&
                            validator.message(
                              "representative_phone_additional",
                              representativePhoneAdditional,
                              "regex:^\\+251[1-9][0-9]{8}$",
                              {
                                messages: {
                                  regex:
                                    "Must be a valid Ethiopian number (e.g., +251912345678)",
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-full md:w-1/3">
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-900"
                          >
                            Gender <span className="text-red-500">*</span>
                          </Typography>
                          <select
                            name="gender"
                            value={representativeGender}
                            onChange={(e) =>
                              setRepresentativeGender(e.target.value)
                            }
                            className="block w-full p-3 rounded-md border border-blue-200 text-gray-700 bg-white shadow-sm"
                          >
                            <option value="" disabled>
                              Select gender
                            </option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div className="w-full md:w-1/3">
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-900"
                          >
                            ID Type <span className="text-red-500">*</span>
                          </Typography>
                          <select
                            name="id_type"
                            value={selectedIdTypes}
                            onChange={(e) => setSelectedIdTypes(e.target.value)}
                            className="block w-full p-3 rounded-md border border-blue-200 text-gray-700 bg-white shadow-sm"
                          >
                            <option value="">Select Id type</option>

                            {idTypes.data.map((data) => (
                              <option
                                key={data.id_type_id}
                                value={data.id_type_id}
                              >
                                {data.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="border-b-2 border-gray-200 pb-4 mb-4">
                            <h3 className="text-base font-medium text-gray-800">
                              ID (Front Side){" "}
                              <span className="text-red-500">*</span>
                            </h3>
                            <div
                              {...getRootPropsId()}
                              className={`border-2 border-dashed ${
                                validator.errorMessages.representativeIdFile
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } p-5 text-center rounded-md cursor-pointer`}
                            >
                              <input
                                {...getInputPropsId({
                                  accept: ".pdf,.png,.jpg,.jpeg",
                                  onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file && validateFile(file)) {
                                      if (
                                        representativeIdFile &&
                                        representativeIdFile.request_document_id
                                      ) {
                                        const newFile = Object.assign(file, {
                                          replaceDocumentId:
                                            representativeIdFile.request_document_id,
                                        });
                                        setRepresentativeIdFile(newFile);
                                      } else {
                                        setRepresentativeIdFile(file);
                                      }
                                    }
                                  },
                                })}
                              />
                              <p className="text-sm text-gray-500">
                                Drag or click to select ID front (PDF, PNG, JPG
                                up to 5MB)
                              </p>
                            </div>

                            {validator.message(
                              "representativeIdFile",
                              representativeIdFile,
                              "required",
                              {
                                messages: {
                                  required: "ID front is required",
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}

                            {representativeIdFile && (
                              <div className="mt-2">
                                <div className="flex items-center">
                                  <span
                                    onClick={(e) => {
                                      setPreviewFile(representativeIdFile);
                                      setIsPreviewModalOpen(true);
                                      e.stopPropagation();
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                  >
                                    {representativeIdFile.name || "ID Front"}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {representativeIdFile.size
                                      ? `(${(
                                          representativeIdFile.size /
                                          (1024 * 1024)
                                        ).toFixed(2)} MB)`
                                      : ""}
                                  </span>
                                </div>
                                {!validateFile(representativeIdFile) &&
                                  !representativeIdFile.request_document_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                      Invalid file type or size (must be PDF,
                                      PNG, JPG under 5MB)
                                    </p>
                                  )}
                              </div>
                            )}

                            {!representativeIdFile && (
                              <p className="text-sm text-gray-500">
                                No file selected
                              </p>
                            )}
                          </div>

                          <div className="border-b-2 border-gray-200 pb-4 mb-4">
                            <h3 className="text-base font-medium text-gray-800">
                              ID (Back Side){" "}
                              <span className="text-red-500">*</span>
                            </h3>
                            <div
                              {...getRootPropsIdBack()}
                              className={`border-2 border-dashed ${
                                validator.errorMessages.representativeIdBackFile
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } p-5 text-center rounded-md cursor-pointer`}
                            >
                              <input
                                {...getInputPropsIdBack({
                                  accept: ".pdf,.png,.jpg,.jpeg",
                                  onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file && validateFile(file)) {
                                      if (
                                        representativeIdBackFile &&
                                        representativeIdBackFile.request_document_id
                                      ) {
                                        const newFile = Object.assign(file, {
                                          replaceDocumentId:
                                            representativeIdBackFile.request_document_id,
                                        });
                                        setRepresentativeIdBackFile(newFile);
                                      } else {
                                        setRepresentativeIdBackFile(file);
                                      }
                                    }
                                  },
                                })}
                              />
                              <p className="text-sm text-gray-500">
                                Drag or click to select ID back (PDF, PNG, JPG
                                up to 5MB)
                              </p>
                            </div>

                            {validator.message(
                              "representativeIdBackFile",
                              representativeIdBackFile,
                              "required",
                              {
                                messages: {
                                  required: "ID back is required",
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}

                            {representativeIdBackFile && (
                              <div className="mt-2">
                                <div className="flex items-center">
                                  <span
                                    onClick={(e) => {
                                      setPreviewFile(representativeIdBackFile);
                                      setIsPreviewModalOpen(true);
                                      e.stopPropagation();
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                  >
                                    {representativeIdBackFile.name || "ID Back"}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {representativeIdBackFile.size
                                      ? `(${(
                                          representativeIdBackFile.size /
                                          (1024 * 1024)
                                        ).toFixed(2)} MB)`
                                      : ""}
                                  </span>
                                </div>
                                {!validateFile(representativeIdBackFile) &&
                                  !representativeIdBackFile.request_document_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                      Invalid file type or size (must be PDF,
                                      PNG, JPG under 5MB)
                                    </p>
                                  )}
                              </div>
                            )}

                            {!representativeIdBackFile && (
                              <p className="text-sm text-gray-500">
                                No file selected
                              </p>
                            )}
                          </div>
                        </div>

                        {sameAsApplicant === false && (
                          <div className="flex-1 space-y-4 border-b-2 border-gray-200 pb-4 mb-4">
                            <h3 className="text-base font-medium text-gray-800">
                              Letter
                            </h3>
                            <div
                              {...getRootPropsLetter()}
                              className={`border-2 border-dashed ${
                                representationLetterFile &&
                                !representationLetterFile.request_document_id &&
                                !validateFile(representationLetterFile)
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } p-5 text-center rounded-md cursor-pointer`}
                            >
                              <input
                                {...getInputPropsLetter({
                                  accept: ".pdf,.png,.jpg,.jpeg",
                                  onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file && validateFile(file)) {
                                      if (
                                        representationLetterFile &&
                                        representationLetterFile.request_document_id
                                      ) {
                                        const newFile = Object.assign(file, {
                                          replaceDocumentId:
                                            representationLetterFile.request_document_id,
                                        });
                                        setRepresentationLetterFile(newFile);
                                      } else {
                                        setRepresentationLetterFile(file);
                                      }
                                    }
                                  },
                                })}
                              />
                              <p className="text-sm text-gray-500">
                                Drag or click to select a file (PDF, PNG, JPG up
                                to 5MB)
                              </p>
                            </div>

                            {representationLetterFile && (
                              <div className="mt-2">
                                <div className="flex items-center">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewFile(representationLetterFile);
                                      setIsPreviewModalOpen(true);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                  >
                                    {representationLetterFile.name ||
                                      "Representation Letter"}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {representationLetterFile.size
                                      ? `(${(
                                          representationLetterFile.size /
                                          (1024 * 1024)
                                        ).toFixed(2)} MB)`
                                      : ""}
                                  </span>
                                </div>
                                {!validateFile(representationLetterFile) &&
                                  !representationLetterFile.request_document_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                      Invalid file type or size (must be PDF,
                                      PNG, JPG under 5MB)
                                    </p>
                                  )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeStep === 2 && (
              <div className="w-full px-9 rounded-md">
                <div className="overflow-y-auto scrollbar-hide touch-pan-y">
                  <div className="flex justify-between items-center mb-4">
                    <div className="mb-8">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-700"
                      >
                        Respondents Information
                      </Typography>
                      <Typography
                        variant="body1"
                        className="text-gray-600 mt-2"
                      >
                        Here are the respondent's details provided in relation
                        to the complaint request.
                      </Typography>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddRespondent}
                      color={sidenavColor}
                      variant="text"
                    >
                      + Add Respondent
                    </Button>
                  </div>

                  {respondents.map((respondent, index) => (
                    <div
                      key={index}
                      className="space-y-6 w-full border-b-2 border-indigo-200 pb-14 mb-6 relative"
                    >
                      {respondents.length > 1 && (
                        <div className="absolute top-0 right-0">
                          <Button
                            type="button"
                            onClick={() => handleRemoveRespondent(index)}
                            color="error"
                            variant="text"
                            size="small"
                            className="text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      {respondents.length > 1 && (
                        <div className="absolute top-0 left-0">
                          <div className="text-[14px] font-semibold">
                            Respondent {index + 1}
                          </div>
                        </div>
                      )}
                      <div
                        className={`space-y-6 w-full ${
                          respondents.length > 1 ? "pt-14" : ""
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Name <span className="text-red-500">*</span>
                            </Typography>
                            <Input
                              placeholder="Respondent Name"
                              name={`respondent_name_${index}`}
                              value={respondent.name}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "name",
                                  e.target.value,
                                  "respondent"
                                );
                                validator.showMessageFor(
                                  `respondent_name_${index}`
                                );
                              }}
                              className={`w-full px-4 py-3 border ${
                                validator.errorMessages[
                                  `respondent_name_${index}`
                                ]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded-lg shadow-sm`}
                            />
                            {validator.message(
                              `respondent_name_${index}`,
                              respondent.name,
                              "required|alpha_space|min:2|max:100",
                              {
                                messages: {
                                  required: "Respondent name is required",
                                  alpha_space:
                                    "Name should only contain letters and spaces",
                                  min: "Name should be at least 2 characters",
                                  max: "Name should not exceed 100 characters",
                                },
                              }
                            )}
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Phone Number{" "}
                              <span className="text-red-500">*</span>
                            </Typography>

                            <div className="relative">
                              <Input
                                placeholder="*********"
                                name={`respondent_phone_${index}`}
                                value={respondent.phone.replace(/^\+251/, "")}
                                onChange={(e) => {
                                  const digits = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 9);
                                  const fullNumber = `+251${digits}`;
                                  handleInputChange(
                                    index,
                                    "phone",
                                    fullNumber,
                                    "respondent"
                                  );
                                  validator.showMessageFor(
                                    `respondent_phone_${index}`
                                  );
                                }}
                                className={`pl-16 pr-4 py-2 w-full border rounded-lg shadow-sm ${
                                  validator.errorMessages[
                                    `respondent_phone_${index}`
                                  ]
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                maxLength={9}
                              />
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-gray-700">
                                +251
                              </span>
                            </div>

                            {/* Validation message */}
                            {validator.message(
                              `respondent_phone_${index}`,
                              respondent.phone,
                              "required|regex:^\\+251[1-9][0-9]{8}$",
                              {
                                messages: {
                                  required: "Phone number is required",
                                  regex:
                                    "Must be a valid Ethiopian number (e.g., +251912345678)",
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Region / City Administration{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="respondent_region"
                              value={respondent.region}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "region",
                                  e.target.value,
                                  "respondent"
                                )
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                            >
                              <option value="">
                                Select Region or City Administration
                              </option>
                              {regions.map((region) => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          {/* Zone Select */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Zone / Sub-City{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name={`respondent_zone_${index}`}
                              value={respondent.zone}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "zone",
                                  e.target.value,
                                  "respondent"
                                );
                                validator.showMessageFor(
                                  `respondent_zone_${index}`
                                );
                              }}
                              className={`w-full p-3 border rounded-lg shadow-sm ${
                                validator.errorMessages[
                                  `respondent_zone_${index}`
                                ]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              disabled={!respondent.region}
                            >
                              <option value="">Select Zone or Sub-City</option>
                              {respondentZones[index]?.map((zone) => (
                                <option
                                  key={zone.zone_id || zone.subcity_id}
                                  value={zone.zone_id || zone.subcity_id}
                                >
                                  {zone.name}
                                </option>
                              ))}
                            </select>
                            {validator.message(
                              `respondent_zone_${index}`,
                              respondent.zone,
                              "required",
                              {
                                messages: { required: "Zone is required" },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div>

                          {/* Woreda Select */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Woreda <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name={`respondent_woreda_${index}`}
                              value={respondent.woreda}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "woreda",
                                  e.target.value,
                                  "respondent"
                                );
                                validator.showMessageFor(
                                  `respondent_woreda_${index}`
                                );
                              }}
                              className={`w-full p-3 border rounded-lg shadow-sm ${
                                validator.errorMessages[
                                  `respondent_woreda_${index}`
                                ]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              disabled={!respondent.zone}
                            >
                              <option value="">Select Woreda</option>
                              {respondentWoredas[index]?.map((woreda) => (
                                <option
                                  key={woreda.woreda_id}
                                  value={woreda.woreda_id}
                                >
                                  {woreda.name}
                                </option>
                              ))}
                            </select>
                            {validator.message(
                              `respondent_woreda_${index}`,
                              respondent.woreda,
                              "required",
                              {
                                messages: { required: "Woreda is required" },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div>

                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              Other Address (City, Kebele, etc.)
                            </Typography>
                            <Input
                              placeholder="City, Kebele, etc."
                              name="respondent_address"
                              value={respondent.otherAddress}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "otherAddress",
                                  e.target.value,
                                  "respondent"
                                )
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeStep === 3 && (
              <div className=" w-full  px-9 rounded-md">
                <div className="flex justify-between items-start space-x-8  border-b-2 border-gray-300 pb-6 overflow-y-auto scrollbar-hide touch-pan-y">
                  <div className="flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Typography
                          variant="h6"
                          className="text-lg font-semibold text-gray-700"
                        >
                          Complaints
                        </Typography>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            Court Case Result Reference Number{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            placeholder="Court Case Result Reference"
                            name="court_case_result_reference"
                            onChange={(e) =>
                              setCourtCaseResultReference(e.target.value)
                            }
                            value={courtCaseResultReference}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                            containerProps={{
                              className: "min-w-full",
                            }}
                          />
                        </div>

                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            Case Type <span className="text-red-500">*</span>
                          </Typography>
                          <select
                            value={caseTypeId}
                            onChange={(e) => setCaseTypeId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                          >
                            <option value="">Select Case Type</option>
                            {caseTypes.map((type) => (
                              <option
                                key={type.case_type_id}
                                value={type.case_type_id}
                              >
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4 mt-4">
                        <Typography
                          variant="h6"
                          className="text-lg font-semibold text-gray-700"
                        >
                          Violated Constitution Article
                        </Typography>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            Violated Constitution Article{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            placeholder="Violated Constitution Article"
                            name="violated_constitution_article"
                            onChange={(e) =>
                              setViolatedConstitutionArticle(e.target.value)
                            }
                            value={violatedConstitutionArticle}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg  shadow-sm"
                            containerProps={{
                              className: "min-w-full",
                            }}
                          />
                        </div>
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            Affair Description{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <textarea
                            onChange={(e) => {
                              setAffairDescription(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            value={affairDescription}
                            id="affair_description"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg  shadow-sm"
                            placeholder="Affair Description"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-4">
                        <Typography
                          variant="h6"
                          className="text-lg font-semibold text-gray-700"
                        >
                          Other Applicable Laws and Constitutional Complaint
                          Summary
                        </Typography>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            Other Applicable Laws{" "}
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            placeholder="Other Applicable Laws"
                            name="other_applicable_laws"
                            onChange={(e) =>
                              setOtherApplicableLaws(e.target.value)
                            }
                            value={otherApplicableLaws}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg  shadow-sm"
                            containerProps={{
                              className: "min-w-full",
                            }}
                          />
                        </div>
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            Constitutional Complaint Summary{" "}
                          </Typography>
                          <textarea
                            onChange={(e) => {
                              setConstitutionalComplaintSummary(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            value={constitutionalComplaintSummary}
                            id="constitutional_complaint_summary"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg  shadow-sm"
                            placeholder="Constitutional Complaint Summary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className=" w-full  px-9 rounded-md">
                <div className="flex justify-between items-start space-x-8 overflow-y-auto scrollbar-hide touch-pan-y">
                  {" "}
                  <div className="flex-1">
                    <div className="">
                      <div className="flex justify-between items-center mb-4">
                        <Typography
                          variant="h6"
                          className="text-lg font-semibold text-gray-700"
                        >
                          Attach Documents{" "}
                          <span className="text-red-500">*</span>
                        </Typography>
                      </div>

                      <div className="space-y-4 w-full border-b-2 border-gray-200 pb-4 mb-4">
                        <div
                          {...getRootPropsComplaint()}
                          style={{
                            border: "2px dashed #ccc",
                            padding: "20px",
                            textAlign: "center",
                          }}
                        >
                          <input {...getInputPropsComplaint()} />
                          <p>
                            Drag & drop files here, or click to select files
                          </p>
                        </div>

                        <h3>Selected Files</h3>
                        <ul>
                          {complaintDocumentFiles.map((file, index) => {
                            return (
                              <li key={file.request_document_id}>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFile(file);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                >
                                  {file.name ||
                                    `${t("home.document")} (${index + 1})`}{" "}
                                </span>{" "}
                                <button
                                  onClick={() =>
                                    handleFileRemoval(
                                      file.request_document_id || file.name,
                                      "complaintDocument"
                                    )
                                  }
                                  className="text-indigo-800 mx-3 hover:underline"
                                >
                                  Remove
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="w-full px-9 rounded-md ">
                <div className="mb-8">
                  <Typography
                    variant="h4"
                    className="text-2xl font-bold text-gray-800"
                  >
                    Review Your Submission
                  </Typography>
                  <Typography variant="body1" className="text-gray-600 mt-2">
                    Please review all the information you have provided before
                    submitting your complaint.
                  </Typography>
                </div>

                <div className="space-y-6 lg:h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide touch-pan-y">
                  <div className="bg-white rounded-lg  border-b-[1.5px] border-blue-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-800"
                      >
                        Applicants Details
                      </Typography>
                    </div>
                    <Typography variant="body1" className="text-gray-600 mb-6">
                      Here are the applicant's personal details provided in
                      relation to the complaint request.
                    </Typography>

                    <div className="space-y-6">
                      {applicants.map((applicant, index) => (
                        <div
                          key={index}
                          className="border border-gray-100 rounded-lg p-5 bg-gray-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Applicant Name
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {applicant.name}
                              </Typography>
                            </div>
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Phone Number
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {applicant.phone}
                              </Typography>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Region / City Administration
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {getRegionName(applicant.region)}
                              </Typography>
                            </div>
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Zone / Sub-City
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {getZoneName(applicant.zone, index)}
                              </Typography>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Woreda
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {getWoredaName(applicant.woreda)}
                              </Typography>
                            </div>
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Other Address
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {applicant.otherAddress || "N/A"}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border-b-[1.5px] border-blue-100 p-6">
                    <Typography
                      variant="h6"
                      className="text-lg font-semibold text-gray-800 mb-2"
                    >
                      Representative Details
                    </Typography>
                    <Typography variant="body1" className="text-gray-600 mb-6">
                      Here are personal information for the Operation for the
                      loading trucks.
                    </Typography>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Typography
                            variant="small"
                            className="font-medium text-gray-500 uppercase text-xs"
                          >
                            Representative Name
                          </Typography>
                          <Typography
                            variant="body1"
                            className="font-medium text-gray-800"
                          >
                            {representativeName || "N/A"}
                          </Typography>
                        </div>

                        <div className="space-y-2">
                          <Typography
                            variant="small"
                            className="font-medium text-gray-500 uppercase text-xs"
                          >
                            Gender
                          </Typography>
                          <Typography
                            variant="body1"
                            className="font-medium text-gray-800"
                          >
                            {representativeGender || "N/A"}
                          </Typography>
                        </div>

                        <div className="space-y-2">
                          <Typography
                            variant="small"
                            className="font-medium text-gray-500 uppercase text-xs"
                          >
                            Phone Number
                          </Typography>
                          <Typography
                            variant="body1"
                            className="font-medium text-gray-800"
                          >
                            {representativePhone || "N/A"}
                          </Typography>
                        </div>

                        <div className="space-y-2">
                          <Typography
                            variant="small"
                            className="font-medium text-gray-500 uppercase text-xs"
                          >
                            Additional Phone Number
                          </Typography>
                          <Typography
                            variant="body1"
                            className="font-medium text-gray-800"
                          >
                            {representativePhoneAdditional || "N/A"}
                          </Typography>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Typography
                            variant="small"
                            className="font-medium text-gray-500 uppercase text-xs"
                          >
                            ID Documents
                          </Typography>
                          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                            {representativeIdFile && (
                              <div className="p-3 flex items-center gap-3 hover:bg-gray-50">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFile(representativeIdFile);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                >
                                  <DocumentIcon className="h-5 w-5 flex-shrink-0" />
                                  <Typography
                                    variant="body1"
                                    className="font-medium truncate"
                                  >
                                    {representativeIdFile.name || "ID Front"}
                                  </Typography>
                                </div>
                                <span className="ml-auto text-xs text-gray-500">
                                  {representativeIdFile.size
                                    ? `${(
                                        representativeIdFile.size /
                                        (1024 * 1024)
                                      ).toFixed(2)} MB`
                                    : ""}
                                </span>
                              </div>
                            )}
                            {representativeIdBackFile && (
                              <div className="p-3 flex items-center gap-3 hover:bg-gray-50">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFile(representativeIdBackFile);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                >
                                  <DocumentIcon className="h-5 w-5 flex-shrink-0" />
                                  <Typography
                                    variant="body1"
                                    className="font-medium truncate"
                                  >
                                    {representativeIdBackFile.name || "ID Back"}
                                  </Typography>
                                </div>
                                <span className="ml-auto text-xs text-gray-500">
                                  {representativeIdBackFile.size
                                    ? `${(
                                        representativeIdBackFile.size /
                                        (1024 * 1024)
                                      ).toFixed(2)} MB`
                                    : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {representationLetterFile && (
                          <div className="space-y-2">
                            <Typography
                              variant="small"
                              className="font-medium text-gray-500 uppercase text-xs"
                            >
                              Representation Letter
                            </Typography>
                            {representationLetterFile ? (
                              <div className="border border-gray-200 rounded-lg">
                                <div className="p-3 flex items-center gap-3 hover:bg-gray-50">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewFile(representationLetterFile);
                                      setIsPreviewModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                  >
                                    <DocumentIcon className="h-5 w-5 flex-shrink-0" />
                                    <Typography
                                      variant="body1"
                                      className="font-medium truncate"
                                    >
                                      {representationLetterFile.name ||
                                        "Representation Letter"}
                                    </Typography>
                                  </div>
                                  <span className="ml-auto text-xs text-gray-500">
                                    {representationLetterFile.size
                                      ? `${(
                                          representationLetterFile.size /
                                          (1024 * 1024)
                                        ).toFixed(2)} MB`
                                      : ""}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // <div className="bg-gray-50 p-4 rounded-lg text-center">
                              //   <Typography
                              //     variant="body1"
                              //     className="text-gray-500"
                              //   >
                              //     No representation letter attached
                              //   </Typography>
                              // </div>
                              <></>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border-b-[1.5px] border-blue-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-800"
                      >
                        Respondents Information
                      </Typography>
                    </div>
                    <Typography variant="body1" className="text-gray-600 mb-6">
                      Here are the respondent's personal details provided in
                      relation to the complaint request.
                    </Typography>

                    <div className="space-y-6">
                      {respondents.map((respondent, index) => (
                        <div
                          key={index}
                          className="border border-gray-100 rounded-lg p-5 bg-gray-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Respondent Name
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {respondent.name}
                              </Typography>
                            </div>
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Phone Number
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {respondent.phone}
                              </Typography>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Region / City Administration
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {getRegionName(respondent.region)}
                              </Typography>
                            </div>
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Zone / Sub-City
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {getRespondentZoneName(respondent.zone, index)}{" "}
                              </Typography>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Woreda
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {getRespondentWoredaName(
                                  respondent.woreda,
                                  index
                                )}
                              </Typography>
                            </div>
                            <div className="space-y-2">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-500 uppercase text-xs"
                              >
                                Other Address
                              </Typography>
                              <Typography
                                variant="body1"
                                className="font-medium text-gray-800"
                              >
                                {respondent.otherAddress || "N/A"}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border-b-[1.5px] border-blue-100 p-6">
                    <Typography
                      variant="h6"
                      className="text-lg font-semibold text-gray-800 mb-2"
                    >
                      Court Case Result and Violated Constitution Article
                    </Typography>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Typography
                          variant="small"
                          className="font-medium text-gray-500 uppercase text-xs"
                        >
                          Court Case Result Reference Number
                        </Typography>
                        <Typography
                          variant="body1"
                          className="font-medium text-gray-800"
                        >
                          {courtCaseResultReference || "N/A"}
                        </Typography>
                      </div>

                      <div className="space-y-2">
                        <Typography
                          variant="small"
                          className="font-medium text-gray-500 uppercase text-xs"
                        >
                          Case Type
                        </Typography>
                        <Typography
                          variant="body1"
                          className="font-medium text-gray-800"
                        >
                          {caseTypes.find(
                            (type) => type.case_type_id === caseTypeId
                          )?.name || "Not selected"}
                        </Typography>
                      </div>

                      <div className="space-y-2">
                        <Typography
                          variant="small"
                          className="font-medium text-gray-500 uppercase text-xs"
                        >
                          Violated Constitution Article
                        </Typography>
                        <Typography
                          variant="body1"
                          className="font-medium text-gray-800"
                        >
                          {violatedConstitutionArticle || "N/A"}
                        </Typography>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-2">
                        <Typography
                          variant="small"
                          className="font-medium text-gray-500 uppercase text-xs"
                        >
                          Affair Description
                        </Typography>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[120px] max-h-[200px] overflow-y-auto">
                          <Typography
                            variant="body1"
                            className="text-gray-700 whitespace-pre-line break-words"
                          >
                            {affairDescription ? (
                              affairDescription
                            ) : (
                              <span className="text-gray-400 italic">
                                No description provided
                              </span>
                            )}
                          </Typography>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Typography
                          variant="small"
                          className="font-medium text-gray-500 uppercase text-xs"
                        >
                          Other Applicable Laws
                        </Typography>
                        <Typography
                          variant="body1"
                          className="font-medium text-gray-800"
                        >
                          {otherApplicableLaws || "N/A"}
                        </Typography>
                      </div>
                    </div>

                    <div className="space-y-3 w-full max-w-3xl mt-6 ">
                      {" "}
                      <Typography
                        variant="small"
                        className="font-medium text-gray-500 uppercase text-xs"
                      >
                        Constitutional Complaint Summary
                      </Typography>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[120px] max-h-[200px] overflow-y-auto">
                        <Typography
                          variant="body1"
                          className="text-gray-700 whitespace-pre-line break-words"
                        >
                          {constitutionalComplaintSummary ? (
                            constitutionalComplaintSummary
                          ) : (
                            <span className="text-gray-400 italic">
                              No summary provided
                            </span>
                          )}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <Typography
                      variant="h6"
                      className="text-lg font-semibold text-gray-800 mb-2"
                    >
                      Attached Documents
                    </Typography>

                    <div className="space-y-4">
                      <Typography
                        variant="small"
                        className="font-medium text-gray-500 uppercase text-xs"
                      >
                        Complaint Documents ({complaintDocumentFiles.length})
                      </Typography>

                      {complaintDocumentFiles.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                          {complaintDocumentFiles.map((file, index) => (
                            <div
                              key={index}
                              className="p-3 flex items-center gap-3 hover:bg-gray-50"
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(file);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                              >
                                <DocumentIcon className="h-5 w-5 flex-shrink-0" />
                                <Typography
                                  variant="body1"
                                  className="font-medium truncate"
                                >
                                  {file.name ||
                                    `${t("home.document")} ${index + 1}`}
                                </Typography>
                              </div>
                              <span className="ml-auto text-xs text-gray-500">
                                {file.size
                                  ? `${(file.size / (1024 * 1024)).toFixed(
                                      2
                                    )} MB`
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <Typography variant="body1" className="text-gray-500">
                            No complaint documents attached
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Box className="flex flex-row justify-end gap-3 my-10 ">
              <Typography
                variant="body2"
                onClick={handleBack}
                className={`
                  cursor-pointer 
                  font-semibold 
                  text-base 
                  transition-all 
                  duration-300 
                  ease-in-out 
                  px-10 
                  py-1
                  my-3
                  rounded-lg
                  ${
                    activeStep === 0
                      ? "bg-gray-300 text-gray-500 pointer-events-none"
                      : "bg-white text-[#4475F2] border border-[#4475F2] hover:bg-gray-50"
                  }
                  hover:shadow-sm
                  transform
                  hover:scale-[1.02]
                  active:scale-100
                  inline-block
                `}
              >
                Back
              </Typography>

              <Typography
                variant="body2"
                onClick={
                  activeStep === steps.length - 1 ? handleSubmit : handleNext
                }
                className={`
                  cursor-pointer 
                  font-semibold 
                  text-base 
                  transition-all 
                  duration-300 
                  ease-in-out 
                  px-10 
                  py-1
                  my-3
                  rounded-lg
                  ${
                    activeStep === steps.length - 1
                      ? "bg-[#4475F2] text-white hover:bg-primary-dark"
                      : "bg-[#4475F2] text-white hover:bg-[#4475F2]"
                  }
                  hover:shadow-sm
                  transform
                  hover:scale-[1.02]
                  active:scale-100
                  inline-block
                `}
              >
                {activeStep === steps.length - 1 ? "Update" : "Next"}
              </Typography>

              {activeStep !== steps.length && completed[activeStep] ? (
                <Typography
                  variant="caption"
                  className="inline-block text-secondary ml-2 text-sm italic"
                >
                  Step {activeStep + 1} already completed
                </Typography>
              ) : null}
            </Box>
          </form>
        </div>

        <LivePreview
          applicants={applicants}
          respondents={respondents}
          representativeName={representativeName}
          representativeGender={representativeGender}
          representativePhone={representativePhone}
          representativePhoneAdditional={representativePhoneAdditional}
          representativeIdFile={representativeIdFile}
          representativeIdBackFile={representativeIdBackFile}
          representationLetterFile={representationLetterFile}
          courtCaseResultReference={courtCaseResultReference}
          caseTypeId={caseTypeId}
          caseTypes={caseTypes}
          violatedConstitutionArticle={violatedConstitutionArticle}
          affairDescription={affairDescription}
          otherApplicableLaws={otherApplicableLaws}
          constitutionalComplaintSummary={constitutionalComplaintSummary}
          complaintDocumentFiles={complaintDocumentFiles}
          getRegionName={getRegionName}
          getZoneName={getZoneName}
          getWoredaName={getWoredaName}
          getResZoneName={getRespondentZoneName}
          getResWoredaName={getRespondentWoredaName}
        />
      </div>

      {isPreviewModalOpen && (
        <EditDocumentPreviewModal
          file={previewFile}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </section>
  );
}

export default EditRequestForm;
