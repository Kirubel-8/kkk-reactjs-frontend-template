import { useMaterialTailwindController } from "@/context";
import CaseType from "@/service/caseType.service";
import regionService from "@/service/region.service";
import requestService from "@/service/request.service";
import woredaService from "@/service/woreda.service";
import zoneService from "@/service/zone.service";
import { ArrowLeftIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { Button, Input, Typography } from "@material-tailwind/react";
import { Box, Step, StepButton, Stepper } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SimpleReactValidator from "simple-react-validator";
import PreviewModal from "./document-preview-modal";
import LivePreview from "./live-preview";
import TermsAndConditionsModal from "./terms-and-conditions-modal";
import { Loading } from "@/PageLoading";

export function NewRequestForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [idTypes, setIdTypes] = useState([]);
  const [citySelected, setCitySelected] = useState(true);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
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
      gender: "",
      id_type_id: "",
      otherAddress: "",
      applicant_type: "individual",
      tin_number: "",
      registration_certificate: null,
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
  const [applicantType, setApplicantType] = useState("individual");
  const [, forceUpdate] = useState({});
  const [files, setFiles] = useState([]);
  const [representativeIdFile, setRepresentativeIdFile] = useState(null);
  const [representationLetterFile, setRepresentationLetterFile] =
    useState(null);

  const [complaintDocumentFiles, setComplaintDocumentFiles] = useState([]);
  const [completed, setCompleted] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const stepFields = {
    0: (index) => [
      `applicant_type_${index}`,
      `applicant_name_${index}`,
      `applicant_phone_${index}`,
      `applicant_region_${index}`,
      `applicant_zone_${index}`,
      `applicant_woreda_${index}`,
      ...(applicants[index].applicant_type === "company"
        ? [`applicant_tin_${index}`]
        : []),
      ...(applicants[index].applicant_type === "non_profit"
        ? [`registration_certificate_${index}`]
        : []),
    ],
    1: () => [
      "representative_name",
      "representative_phone",
      "representative_gender",
      "representative_id_type",
      "representativeIdFile",
      "representativeIdBackFile",
      ...(sameAsApplicant === false ? ["representationLetterFile"] : []),
    ],
    2: (index) => [`respondent_name_${index}`],
    3: () => [
      "court_case_result_reference",
      "case_type_id",
      "violated_constitution_article",
      "affair_description",
    ],
    4: () => ["complaint_document_files"],
  };

  const fieldMappings = {
    applicant: {
      applicant_type: "applicant_type",
      applicant_name: "name",
      applicant_phone: "phone",
      applicant_region: "region",
      applicant_zone: "zone",
      applicant_woreda: "woreda",
      applicant_tin: "tin_number",
      registration_certificate: "registration_certificate",
    },
    respondent: {
      respondent_name: "name",
      respondent_phone: "phone",
    },
  };

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
    let isStepValid = true;

    if (activeStep === 0) {
      applicants.forEach((applicant, index) => {
        const fields = stepFields[activeStep](index);
        fields.forEach((field) => {
          const baseField = field.split("_").slice(0, -1).join("_");
          const fieldName = fieldMappings.applicant[baseField] || field;

          const value = applicant[fieldName];
          const rules = validator.fields[field]?.rules || "required";

          if (!validator.check(value, rules)) {
            isStepValid = false;
          }
        });
      });
    } else if (activeStep === 1) {
      const fields = stepFields[activeStep]();
      fields.forEach((field) => {
        const value =
          field === "representative_name"
            ? representativeName
            : field === "representative_phone"
              ? representativePhone
              : field === "representative_gender"
                ? representativeGender
                : field === "representative_id_type"
                  ? selectedIdTypes
                  : field === "representativeIdFile"
                    ? representativeIdFile
                    : field === "representativeIdBackFile"
                      ? representativeIdBackFile
                      : field === "representationLetterFile"
                        ? representationLetterFile
                        : null;
        const rules = validator.fields[field]?.rules || "required";
        if (!validator.check(value, rules)) {
          isStepValid = false;
        }
      });
    } else if (activeStep === 2) {
      respondents.forEach((respondent, index) => {
        const fields = stepFields[activeStep](index);
        fields.forEach((field) => {
          const baseField = field.split("_").slice(0, -1).join("_");
          const fieldName = fieldMappings.respondent[baseField] || field;
          const value = respondent[fieldName];
          const rules = validator.fields[field]?.rules || "required";
          if (!validator.check(value, rules)) {
            isStepValid = false;
          }
        });
      });
    } else if (activeStep === 3) {
      const fields = stepFields[activeStep]();
      fields.forEach((field) => {
        const value =
          field === "court_case_result_reference"
            ? courtCaseResultReference
            : field === "case_type_id"
              ? caseTypeId
              : field === "violated_constitution_article"
                ? violatedConstitutionArticle
                : field === "affair_description"
                  ? affairDescription
                  : null;
        const rules = validator.fields[field]?.rules || "required";
        if (!validator.check(value, rules)) {
          isStepValid = false;
        }
      });
    } else if (activeStep === 4) {
      const fields = stepFields[activeStep]();
      fields.forEach((field) => {
        const value =
          field === "complaint_document_files" ? complaintDocumentFiles : null;
        const rules =
          validator.fields[field]?.rules || "required|array|min:1,array";

        if (!validator.check(value, rules)) {
          isStepValid = false;
        }
      });
    }

    if (isStepValid) {
      const newActiveStep =
        isLastStep() && !allStepsCompleted()
          ? steps.findIndex((step, i) => !(i in completed))
          : activeStep + 1;
      setActiveStep(newActiveStep);
    } else {
      console.log("Validation Errors:", validator.getErrorMessages());
      validator.showMessages();
      forceUpdate({});
    }
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


  const steps = [
    t("newRequest.step1"),
    t("newRequest.step2"),
    t("newRequest.step3"),
    t("newRequest.step4"),
    t("newRequest.step5"),
    t("newRequest.step6"),
  ];

  const onDropHandler = useCallback((acceptedFiles, type) => {
    if (type === "complaintDocument") {
      acceptedFiles.forEach((file) => {
        setFiles((prevFiles) => [...prevFiles, { file, type }]);
        setComplaintDocumentFiles((prevFiles) => [...prevFiles, file]);
      });
    } else {
      const file = acceptedFiles[0];
      setFiles((prevFiles) => {
        return prevFiles
          .filter((item) => item.type !== type)
          .concat({ file, type });
      });

      switch (type) {
        case "representativeId":
          setRepresentativeIdFile(file);
          break;
        case "representativeIdBack":
          setRepresentativeIdBackFile(file);
          break;
        case "representationLetter":
          setRepresentationLetterFile(file);
          break;
        case "registrationCertificate":
          setApplicants((prev) =>
            prev.map((app, i) =>
              i === 0 ? { ...app, registration_certificate: file } : app
            )
          );
          break;
        case "applicantIdFront":
          setApplicantIdFrontFile(file);
          break;
        case "applicantIdBack":
          setApplicantIdBackFile(file);
          break;
        default:
          break;
      }
    }
  }, []);

  const handleFileRemoval = (fileName, type) => {
    console.log(fileName, type);
    setFiles((prevFiles) => {
      return prevFiles.filter(
        (file) => file.file.name !== fileName || file.type !== type
      );
    });

    if (type === "representativeId") {
      setRepresentativeIdFile(null);
    } else if (type === "representativeIdBack") {
      setRepresentativeIdBackFile(null);
    } else if (type === "representationLetter") {
      setRepresentationLetterFile(null);
    } else if (type === "complaintDocument") {
      setComplaintDocumentFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== fileName)
      );
    } else if (type === "registration_certificate") {
      setApplicants((prev) =>
        prev.map((app, i) => (i === 0 ? { ...app, [type]: null } : app))
      );
    } else if (type === "applicantIdFront") {
      setApplicantIdFrontFile(null);
    } else if (type === "applicantIdBack") {
      setApplicantIdBackFile(null);
    }
  };

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
    getRootProps: getRegistrationCertificateProps,
    getInputProps: getRegistrationCertificateInputProps,
  } = useDropzone({
    onDrop: (acceptedFiles) =>
      onDropHandler(acceptedFiles, "registrationCertificate"),
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

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setSameAsApplicant(checked);

    if (checked) {
      setRepresentativeName(applicants[0].name || "");
      setRepresentativePhone(applicants[0].phone || "");
      setRepresentativeGender(applicants[0].gender || "");
      setSelectedIdTypes(applicants[0].id_type_id || "");
      setRepresentativeIdFile(applicantIdFrontFile || null);
      setRepresentativeIdBackFile(applicantIdBackFile || null);
      setFiles((prevFiles) => {
        const filteredFiles = prevFiles.filter(
          (item) =>
            item.type !== "representativeId" &&
            item.type !== "representativeIdBack"
        );
        const newFiles = [];
        if (applicantIdFrontFile) {
          newFiles.push({
            file: applicantIdFrontFile,
            type: "representativeId",
          });
        }
        if (applicantIdBackFile) {
          newFiles.push({
            file: applicantIdBackFile,
            type: "representativeIdBack",
          });
        }
        return [...filteredFiles, ...newFiles];
      });
    } else {
      setRepresentativeName("");
      setRepresentativePhone("");
      setRepresentativeGender("");
      setSelectedIdTypes("");
      setRepresentativeIdFile(null);
      setRepresentativeIdBackFile(null);
    }
  };

  const handleAddApplicant = () => {
    setApplicants([
      ...applicants,
      {
        name: "",
        region: "",
        woreda: "",
        gender: "",
        id_type_id: "",
        zone: "",
        phone: "",
        otherAddress: "",
        applicant_type: "individual",
        tin_number: "",
        registration_certificate: null,
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
    if (type === "applicant") {
      setApplicants((prevApplicants) => {
        const updatedApplicants = [...prevApplicants];
        if (field === "applicant_type") {
          updatedApplicants[index] = {
            name: "",
            region: "",
            woreda: "",
            zone: "",
            phone: "",
            gender: "",
            id_type_id: "",
            otherAddress: "",
            applicant_type: value,
            tin_number: "",
            registration_certificate: null,
            id_file_front_url: null,
            id_file_back_url: null,
          };
          setApplicantType(value);
        } else {
          updatedApplicants[index] = {
            ...updatedApplicants[index],
            [field]: value,
          };
        }
        return updatedApplicants;
      });
    } else if (type === "respondent") {
      setRespondents((prevRespondents) => {
        const updatedRespondents = [...prevRespondents];
        updatedRespondents[index] = {
          ...updatedRespondents[index],
          [field]: value,
        };
        return updatedRespondents;
      });
    }
  };

  const handleApplicantFileRemoval = (index, field) => {
    setApplicants((prevApplicants) => {
      const updatedApplicants = [...prevApplicants];
      updatedApplicants[index] = {
        ...updatedApplicants[index],
        [field]: null,
      };
      return updatedApplicants;
    });
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
      setApplicants((prevApplicants) =>
        prevApplicants.map((applicant) => ({
          ...applicant,
          woreda: "",
        }))
      );
      setWoredas([]);

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

  const handleAcceptTerms = () => {
    setIsTermsAccepted(true);
    setIsTermsModalOpen(false);
  };

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
    setIsLoading(true);
    const MIN_LOADING_TIME = 1000;
    const startTime = Date.now();


    if (!isTermsAccepted) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setIsLoading(false);
      setIsTermsModalOpen(true);
      return;
    }

    let isValid = true;

    applicants.forEach((applicant, index) => {
      const fields = stepFields[0](index);
      fields.forEach((field) => {
        const baseField = field.split("_").slice(0, -1).join("_");
        const fieldName = fieldMappings.applicant[baseField] || field;
        const value = applicant[fieldName];
        const rules = validator.fields[field]?.rules || "required";
        if (!validator.check(value, rules)) {
          isValid = false;
        }
      });
    });

    const step1Fields = stepFields[1]();
    step1Fields.forEach((field) => {
      const value =
        field === "representative_name"
          ? representativeName
          : field === "representative_phone"
            ? representativePhone
            : field === "representative_gender"
              ? representativeGender
              : field === "representative_id_type"
                ? selectedIdTypes
                : field === "representativeIdFile"
                  ? representativeIdFile
                  : field === "representativeIdBackFile"
                    ? representativeIdBackFile
                    : field === "representationLetterFile"
                      ? representationLetterFile
                      : null;
      const rules = validator.fields[field]?.rules || "required";
      if (!validator.check(value, rules)) {
        isValid = false;
      }
    });

    respondents.forEach((respondent, index) => {
      const fields = stepFields[2](index);
      fields.forEach((field) => {
        const baseField = field.split("_").slice(0, -1).join("_");
        const fieldName = fieldMappings.respondent[baseField] || field;
        const value = respondent[fieldName];
        const rules = validator.fields[field]?.rules || "required";
        if (!validator.check(value, rules)) {
          isValid = false;
        }
      });
    });

    const step3Fields = stepFields[3]();
    step3Fields.forEach((field) => {
      const value =
        field === "court_case_result_reference"
          ? courtCaseResultReference
          : field === "case_type_id"
            ? caseTypeId
            : field === "violated_constitution_article"
              ? violatedConstitutionArticle
              : field === "affair_description"
                ? affairDescription
                : null;
      const rules = validator.fields[field]?.rules || "required";
      if (!validator.check(value, rules)) {
        isValid = false;
      }
    });

    const step4Fields = stepFields[4]();
    step4Fields.forEach((field) => {
      const value = field === "complaint_document_files" ? files : null;
      const rules =
        validator.fields[field]?.rules || "required|array|min:1,array";
      if (!validator.check(value, rules)) {
        isValid = false;
      }
    });

    if (!isValid) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setIsLoading(false);
      console.log("Validation Errors:", validator.getErrorMessages());
      validator.showMessages();
      forceUpdate({});

      toast.error("Please fill in all required fields correctly.", {
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

    try {
      if (!navigator.onLine) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));
        setIsLoading(false);
        throw new Error('No internet connection. Please check your network and try again.');
      }
      const token = localStorage.getItem("customerAccountToken");

      if (!token) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

        await new Promise(resolve => setTimeout(resolve, remainingTime));
        setIsLoading(false);
        toast.error("Session expired. Please login again", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          transition: Zoom,
        });
        navigate("/login");
        return;
      }

      const decodedToken = jwtDecode(token);
      const customerId = decodedToken.id;
      const sanitizedApplicants = applicants.map((applicant) => ({
        ...applicant,
        id_type_id: applicant.id_type_id === "" ? null : applicant.id_type_id,
      }));

      const requestData = {
        representative_name: representativeName,
        gender: representativeGender,
        phone: representativePhone,
        phone_additional: representativePhoneAdditional,
        id_type: selectedIdTypes,
        applicants: sanitizedApplicants,
        respondents,
        violated_constitution_article: violatedConstitutionArticle,
        affair_description: affairDescription,
        other_applicable_laws: otherApplicableLaws,
        constitutional_complaint_summary: constitutionalComplaintSummary,
        court_case_result_reference: courtCaseResultReference,
        documents: files,
        customer_id: customerId,
        case_type_id: caseTypeId,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await requestService.createRequest(requestData, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setIsLoading(false);

      setIsButtonDisabled(true)

      toast.success("Request submitted successfully!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Zoom,
      });

      setTimeout(() => {
        setIsButtonDisabled(false)
      }, 3000);
      setTimeout(() => {
        navigate("/home/requests");
      }, 3000);


    } catch (error) {
      console.error("Submission error:", error);
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      setIsLoading(false);
      let errorMessage = "There was an error submitting the request.";
      let toastConfig = {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        transition: Zoom,
      };

      if (error.message === 'No internet connection. Please check your network and try again.') {
        errorMessage = "You're offline. Please check your internet connection and try again.";
        toastConfig = {
          ...toastConfig,
          autoClose: 8000,
          icon: "📶",
        };
      } else if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please check your connection and try again.";
        toastConfig = {
          ...toastConfig,
          autoClose: 6000,
          icon: "⏳",
        };
      } else if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again";
          toastConfig.icon = "🔒";
          setTimeout(() => navigate("/login"), 3000);
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
          toastConfig.icon = "⚠️";
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection and try again.";
        toastConfig.icon = "🌐";
      }

      toast.error(errorMessage, toastConfig);

    } finally {
      setIsLoading(false);

    }
  };

  const getApplicantRootProps = (index, type) => {
    return {
      onClick: (e) => e.stopPropagation(),
      onDrop: (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file && validateFile(file)) {
          handleInputChange(index, type, file, "applicant");
        }
      },
    };
  };

  const getApplicantInputProps = (index, type) => {
    return {
      accept: ".pdf,.png,.jpg,.jpeg",
      type: "file",
      onChange: (e) => {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
          handleInputChange(index, type, file, "applicant");
        }
      },
    };
  };

  return (
    <section className="mx-auto px-4 py-1 lg:py-2">
      {isLoading && !isTermsAccepted && <Loading text="loading..." open={isLoading} />}
      {isLoading && isTermsAccepted && <Loading text="Processing your request..." open={isLoading} />}

      <div className="flex items-center gap-8 mb-4">
        <NavLink to={`/home/requests`}>
          <Button variant="outlined" className="flex items-center gap-2">
            <ArrowLeftIcon className="h-3 w-3 text-gray-600" />
          </Button>
        </NavLink>

        <div className="space-y-1">
          <h1 className="text-xl font-bold">{t("newRequest.title")}</h1>
          <h2 className="text-l font-extralight text-gray-600">
            {t("newRequest.subtitle")}
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
          <h3 className="text-xl font-semibold mb-4">
            {t("newRequest.stepsTitle")}
          </h3>
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
                    <div className="mb-2">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-700"
                      >
                        {t("newRequest.applicantDetails.title")}
                      </Typography>

                      <Typography
                        variant="body1"
                        className="text-gray-600 mt-2"
                      >
                        {t("newRequest.applicantDetails.description")}
                      </Typography>
                    </div>
                    {/* <Button
                      type="button"
                      onClick={handleAddApplicant}
                      color={sidenavColor}
                      variant="text"
                    >
                      + Add Applicant
                    </Button> */}
                  </div>

                  {applicants.map((applicant, index) => (
                    <div
                      key={index}
                      className="space-y-6 w-full border-b-2 border-gray-300 pb-6 mb-4"
                    >
                      <div className="space-y-6 w-full">
                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          <div className="">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.applicantDetails.applicantType")}{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <div className="flex flex-wrap space-x-4 ">
                              {[
                                "individual",
                                "company",
                                "non_profit",
                                "government",
                              ].map((type) => (
                                <label
                                  key={type}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="radio"
                                    name={`applicant_type_${index}`}
                                    value={type}
                                    checked={applicant.applicant_type === type}
                                    onChange={(e) =>
                                      handleInputChange(
                                        index,
                                        "applicant_type",
                                        e.target.value,
                                        "applicant"
                                      )
                                    }
                                    className="form-radio text-indigo-600"
                                  />
                                  <span className="text-gray-700">
                                    {t(
                                      `newRequest.applicantDetails.applicantTypes.${type}`
                                    )}
                                  </span>
                                </label>
                              ))}
                            </div>
                            {validator.message(
                              `applicant_type_${index}`,
                              applicant.applicant_type,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.applicantDetails.validation.applicantTypeRequired"
                                  ),
                                },
                              }
                            )}
                          </div>
                        </div>

                        {/* First Row */}
                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          {/* Full Name */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {applicant.applicant_type === "individual"
                                ? t("newRequest.applicantDetails.fullName")
                                : t(
                                  "newRequest.applicantDetails.companyName"
                                )}{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <Input
                              placeholder={t(
                                applicant.applicant_type === "individual"
                                  ? "newRequest.applicantDetails.placeholders.fullName"
                                  : "newRequest.applicantDetails.placeholders.companyName"
                              )}
                              name="applicant_name"
                              value={applicant.name}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "name",
                                  e.target.value,
                                  "applicant"
                                );
                                validator.showMessageFor(
                                  `applicant_name_${index}`
                                );
                              }}
                              className={`w-full px-4 py-3 border rounded-lg shadow-sm ${validator.errorMessages[
                                `applicant_name_${index}`
                              ]
                                ? "border-red-500"
                                : "border-gray-300"
                                }`}
                            />
                            {validator.message(
                              `applicant_name_${index}`,
                              applicant.name,
                              applicant.applicant_type === "individual"
                                ? "required|min:3"
                                : "required|min:3",
                              {
                                messages: {
                                  required: t(
                                    applicant.applicant_type === "individual"
                                      ? "newRequest.applicantDetails.validation.fullNameRequired"
                                      : "newRequest.applicantDetails.validation.companyNameRequired"
                                  ),
                                  alpha_space: t(
                                    "newRequest.applicantDetails.validation.fullNameAlpha"
                                  ),
                                  min: t(
                                    applicant.applicant_type === "individual"
                                      ? "newRequest.applicantDetails.validation.fullNameMin"
                                      : "newRequest.applicantDetails.validation.companyNameMin"
                                  ),
                                },
                              }
                            )}
                          </div>

                          {/* Phone Number */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.applicantDetails.phoneNumber")}{" "}
                              <span className="text-red-500">*</span>
                            </Typography>

                            <div className="relative">
                              <Input
                                placeholder={t(
                                  "newRequest.applicantDetails.placeholders.phoneNumber"
                                )}
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
                                className={`pl-16 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm ${validator.errorMessages.applicant_phone
                                  ? "border-red-500"
                                  : ""
                                  }`}
                                maxLength={9}
                              />
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-gray-700">
                                +251
                              </span>
                            </div>

                            {validator.message(
                              "applicant_phone",
                              applicant.phone,
                              "required|regex:^\\+251[1-9][0-9]{8}$",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.applicantDetails.validation.phoneNumberRequired"
                                  ),
                                  regex: t(
                                    "newRequest.applicantDetails.validation.phoneNumberRegex"
                                  ),
                                },
                              }
                            )}
                          </div>

                          {/* Region */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.applicantDetails.region")}{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="applicant_region"
                              value={applicant.region}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "region",
                                  e.target.value,
                                  "applicant"
                                );
                                validator.showMessageFor(
                                  `applicant_region_${index}`
                                );
                              }}
                              className={`w-full p-3 border border-gray-300 rounded-lg shadow-sm ${validator.errorMessages[
                                `applicant_region_${index}`
                              ]
                                ? "border-red-500"
                                : ""
                                }`}
                            >
                              <option value="">
                                {t(
                                  "newRequest.applicantDetails.placeholders.region"
                                )}
                              </option>
                              {regions.map((region) => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                            {validator.message(
                              `applicant_region_${index}`,
                              applicant.region,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.applicantDetails.validation.regionRequired"
                                  ),
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div>
                        </div>

                        {/* Second Row */}
                        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                          {/* Zone */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.applicantDetails.zone")}{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="applicant_zone"
                              value={applicant.zone}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "zone",
                                  e.target.value,
                                  "applicant"
                                );
                                validator.showMessageFor(
                                  `applicant_zone_${index}`
                                );
                              }}
                              className={`w-full p-3 border border-gray-300 rounded-lg shadow-sm ${validator.errorMessages[
                                `applicant_zone_${index}`
                              ]
                                ? "border-red-500"
                                : ""
                                }`}
                              disabled={!applicant.region}
                            >
                              <option value="">
                                {t(
                                  "newRequest.applicantDetails.placeholders.zone"
                                )}
                              </option>
                              {zones.map((zone) => (
                                <option
                                  key={zone.zone_id || zone.subcity_id}
                                  value={zone.zone_id || zone.subcity_id}
                                >
                                  {zone.name}
                                </option>
                              ))}
                            </select>
                            {validator.message(
                              `applicant_zone_${index}`,
                              applicant.zone,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.applicantDetails.validation.zoneRequired"
                                  ),
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div>

                          {/* Woreda */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.applicantDetails.woreda")}{" "}
                              <span className="text-red-500">*</span>
                            </Typography>
                            <select
                              name="applicant_woreda"
                              value={applicant.woreda}
                              onChange={(e) => {
                                handleInputChange(
                                  index,
                                  "woreda",
                                  e.target.value,
                                  "applicant"
                                );
                                validator.showMessageFor(
                                  `applicant_woreda_${index}`
                                );
                              }}
                              className={`w-full p-3 border border-gray-300 rounded-lg shadow-sm ${validator.errorMessages[
                                `applicant_woreda_${index}`
                              ]
                                ? "border-red-500"
                                : ""
                                }`}
                              disabled={!applicant.region}
                            >
                              <option value="">
                                {t(
                                  "newRequest.applicantDetails.placeholders.woreda"
                                )}
                              </option>
                              {woredas.map((woreda) => (
                                <option
                                  key={woreda.woreda_id}
                                  value={woreda.woreda_id}
                                >
                                  {woreda.name}
                                </option>
                              ))}
                            </select>
                            {validator.message(
                              `applicant_woreda_${index}`,
                              applicant.woreda,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.applicantDetails.validation.woredaRequired"
                                  ),
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div>

                          {/* Other Address */}
                          <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.applicantDetails.otherAddress")}
                            </Typography>
                            <Input
                              placeholder={t(
                                "newRequest.applicantDetails.placeholders.otherAddress"
                              )}
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

                        {applicant.applicant_type === "company" && (
                          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 mt-6">
                            <div className="w-full md:w-1/3">
                              <Typography
                                variant="small"
                                className="mb-3 font-semibold text-gray-700"
                              >
                                {t("newRequest.applicantDetails.tinNumber")}{" "}
                              </Typography>
                              <Input
                                placeholder={t(
                                  "newRequest.applicantDetails.placeholders.tinNumber"
                                )}
                                name={`applicant_tin_${index}`}
                                value={applicant.tin_number || ""}
                                onChange={(e) => {
                                  handleInputChange(
                                    index,
                                    "tin_number",
                                    e.target.value,
                                    "applicant"
                                  );
                                  validator.showMessageFor(
                                    `applicant_tin_${index}`
                                  );
                                }}
                                className={`w-full px-4 py-3 border rounded-lg shadow-sm ${validator.errorMessages[
                                  `applicant_tin_${index}`
                                ]
                                  ? "border-red-500"
                                  : "border-gray-300"
                                  }`}
                              />
                              {validator.message(
                                `applicant_tin_${index}`,
                                applicant.tin_number,
                                "required|numeric|min:4",
                                {
                                  messages: {
                                    required: t(
                                      "newRequest.applicantDetails.validation.tinNumberRequired"
                                    ),

                                    numeric: t(
                                      "newRequest.applicantDetails.validation.tinNumberNumeric"
                                    ),
                                    min: t(
                                      "newRequest.applicantDetails.validation.tinNumberMin"
                                    ),
                                  },
                                }
                              )}
                            </div>
                          </div>
                        )}
                        {applicant.applicant_type === "non_profit" && (
                          <div className="mt-6">
                            <div className="border-b-2 border-gray-200 pb-4 mb-4">
                              <h3 className="text-base font-medium text-gray-800">
                                {t(
                                  "newRequest.applicantDetails.registrationCertificate"
                                )}
                                <span className="text-red-500">*</span>
                              </h3>

                              <div
                                {...getRegistrationCertificateProps()}
                                className={`border-2 border-dashed ${validator.errorMessages
                                  .registration_certificate
                                  ? "border-red-500"
                                  : "border-gray-300"
                                  } p-5 text-center rounded-md cursor-pointer`}
                              >
                                <input
                                  {...getRegistrationCertificateInputProps()}
                                />
                                <p className="text-sm text-gray-500">
                                  {t(
                                    "newRequest.applicantDetails.fileUpload.registrationCertificatePrompt"
                                  )}
                                </p>
                              </div>

                              {applicant.applicant_type === "non_profit" &&
                                validator.message(
                                  "registration_certificate",
                                  applicant.registration_certificate,
                                  "required",
                                  {
                                    messages: {
                                      required: t(
                                        "newRequest.applicantDetails.validation.registrationCertificateRequired"
                                      ),
                                    },
                                    className: "text-red-500 text-xs mt-1",
                                  }
                                )}

                              {applicant.registration_certificate && (
                                <div className="mt-2">
                                  <div className="flex items-center">
                                    <span
                                      onClick={(e) => {
                                        setPreviewFile(
                                          applicant.registration_certificate
                                        );
                                        setIsPreviewModalOpen(true);
                                        e.stopPropagation();
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                    >
                                      {applicant.registration_certificate.name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      (
                                      {(
                                        applicant.registration_certificate
                                          .size /
                                        (1024 * 1024)
                                      ).toFixed(2)}{" "}
                                      MB)
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        console.log(applicant);
                                        handleFileRemoval(
                                          applicant.registration_certificate
                                            .name,
                                          "registration_certificate"
                                        );
                                        e.stopPropagation();
                                      }}
                                      className="text-indigo-800 mx-3 hover:underline"
                                    >
                                      {t(
                                        "newRequest.applicantDetails.fileUpload.remove"
                                      )}
                                    </button>
                                  </div>
                                  {!validateFile(
                                    applicant.registration_certificate
                                  ) && (
                                      <p className="text-red-500 text-xs mt-1">
                                        {t(
                                          "newRequest.applicantDetails.validation.fileInvalid"
                                        )}
                                      </p>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {applicant.applicant_type === "individual" && (
                          <>
                            <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 mt-6">
                              {/* Gender */}
                              <div className="w-full md:w-1/3">
                                <Typography
                                  variant="small"
                                  className="mb-3 font-semibold text-gray-700"
                                >
                                  {t("newRequest.applicantDetails.gender")}{" "}
                                  <span className="text-gray-500 text-sm">
                                    ({t("newRequest.applicantDetails.optional")}
                                    )
                                  </span>
                                </Typography>
                                <select
                                  name="applicant_gender"
                                  value={applicant.gender}
                                  onChange={(e) =>
                                    handleInputChange(
                                      index,
                                      "gender",
                                      e.target.value,
                                      "applicant"
                                    )
                                  }
                                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                                >
                                  <option value="">
                                    {t(
                                      "newRequest.applicantDetails.placeholders.gender"
                                    )}
                                  </option>
                                  <option value="male">
                                    {t(
                                      "newRequest.applicantDetails.genderOptions.male"
                                    )}
                                  </option>
                                  <option value="female">
                                    {t(
                                      "newRequest.applicantDetails.genderOptions.female"
                                    )}
                                  </option>
                                </select>
                              </div>

                              {/* ID Type */}
                              <div className="w-full md:w-1/3">
                                <Typography
                                  variant="small"
                                  className="mb-3 text-left font-semibold text-gray-700"
                                >
                                  {t("newRequest.applicantDetails.idType")}{" "}
                                  <span className="text-gray-500 text-sm">
                                    ({t("newRequest.applicantDetails.optional")}
                                    )
                                  </span>
                                </Typography>
                                <select
                                  name="id_type"
                                  value={applicant.id_type_id || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      index,
                                      "id_type_id",
                                      e.target.value,
                                      "applicant"
                                    )
                                  }
                                  className="block w-full p-3 rounded-md border border-blue-200 text-gray-700 bg-white shadow-sm"
                                >
                                  <option value="">
                                    {t(
                                      "newRequest.applicantDetails.placeholders.idType"
                                    )}
                                  </option>
                                  {idTypes.data?.map((data) => (
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
                            {/* ID Upload Row */}
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
                                        .getElementById(
                                          "applicant_id_front_input"
                                        )
                                        ?.click()
                                    }
                                  >
                                    <input
                                      {...getInputPropsApplicantFront()}
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
                                            setPreviewFile(
                                              applicantIdFrontFile
                                            );
                                            setIsPreviewModalOpen(true);
                                            e.stopPropagation();
                                          }}
                                          className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                        >
                                          {applicantIdFrontFile.name}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          (
                                          {(
                                            applicantIdFrontFile.size /
                                            (1024 * 1024)
                                          ).toFixed(2)}{" "}
                                          MB)
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleFileRemoval(
                                              applicantIdFrontFile.name,
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
                                        .getElementById(
                                          "applicant_id_back_input"
                                        )
                                        ?.click()
                                    }
                                  >
                                    <input
                                      {...getInputPropsApplicantBack()}
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
                                          {applicantIdBackFile.name}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                          (
                                          {(
                                            applicantIdBackFile.size /
                                            (1024 * 1024)
                                          ).toFixed(2)}{" "}
                                          MB)
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleFileRemoval(
                                              applicantIdBackFile.name,
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
                          </>
                        )}
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
                    <div>
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-700"
                      >
                        {t("newRequest.representativeDetails.title")}
                      </Typography>
                      <Typography
                        variant="body1"
                        className="text-gray-600 mt-2"
                      >
                        {t("newRequest.representativeDetails.description")}
                      </Typography>
                      {applicantType === "individual" && (
                        <div className="flex items-center mt-4">
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
                            {t(
                              "newRequest.representativeDetails.selfRepresentative"
                            )}
                          </label>
                        </div>
                      )}
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
                            {t("newRequest.representativeDetails.name")}{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <Input
                            disabled={sameAsApplicant}
                            color="gray"
                            size="lg"
                            value={representativeName}
                            placeholder={t(
                              "newRequest.representativeDetails.placeholders.name"
                            )}
                            name="representative_name"
                            className={`w-full px-4 py-3 border ${validator.errorMessages.representative_name
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
                            "required|min:3|max:50",
                            {
                              messages: {
                                required: t(
                                  "newRequest.representativeDetails.validation.nameRequired"
                                ),
                                alpha_space: t(
                                  "newRequest.representativeDetails.validation.nameAlpha"
                                ),
                                min: t(
                                  "newRequest.representativeDetails.validation.nameMin"
                                ),
                                max: t(
                                  "newRequest.representativeDetails.validation.nameMax"
                                ),
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
                            {t("newRequest.representativeDetails.phoneNumber")}{" "}
                            <span className="text-red-500">*</span>
                          </Typography>

                          <div className="relative">
                            <Input
                              disabled={sameAsApplicant}
                              color="gray"
                              size="lg"
                              placeholder={t(
                                "newRequest.representativeDetails.placeholders.phoneNumber"
                              )}
                              name="representative_phone"
                              value={representativePhone.replace(/^\+251/, "")}
                              className={`pl-16 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm ${validator.errorMessages.representative_phone
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
                                required: t(
                                  "newRequest.representativeDetails.validation.phoneNumberRequired"
                                ),
                                regex: t(
                                  "newRequest.representativeDetails.validation.phoneNumberRegex"
                                ),
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
                            {t(
                              "newRequest.representativeDetails.additionalPhoneNumber"
                            )}
                          </Typography>

                          <div className="relative">
                            <Input
                              color="gray"
                              size="lg"
                              placeholder={t(
                                "newRequest.representativeDetails.placeholders.additionalPhoneNumber"
                              )}
                              name="representative_phone_additional"
                              value={representativePhoneAdditional.replace(
                                /^\+251/,
                                ""
                              )}
                              className={`pl-16 pr-4 py-2 w-full border border-gray-300 rounded-lg shadow-sm ${representativePhoneAdditional &&
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

                          {representativePhoneAdditional &&
                            validator.message(
                              "representative_phone_additional",
                              representativePhoneAdditional,
                              "regex:^\\+251[1-9][0-9]{8}$",
                              {
                                messages: {
                                  regex: t(
                                    "newRequest.representativeDetails.validation.phoneNumberRegex"
                                  ),
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
                            {t("newRequest.representativeDetails.gender")}{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <select
                            disabled={sameAsApplicant}
                            name="gender"
                            value={representativeGender}
                            onChange={(e) =>
                              setRepresentativeGender(e.target.value)
                            }
                            className="block w-full p-3 rounded-md border border-blue-200 text-gray-700 bg-white shadow-sm"
                          >
                            <option value="" disabled>
                              {t(
                                "newRequest.representativeDetails.placeholders.gender"
                              )}
                            </option>
                            <option value="male">
                              {t(
                                "newRequest.representativeDetails.genderOptions.male"
                              )}
                            </option>
                            <option value="female">
                              {t(
                                "newRequest.representativeDetails.genderOptions.female"
                              )}
                            </option>
                          </select>
                        </div>
                        <div className="w-full md:w-1/3">
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-900"
                          >
                            {t("newRequest.representativeDetails.idType")}{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <select
                            disabled={sameAsApplicant}
                            name="id_type"
                            value={selectedIdTypes}
                            onChange={(e) => setSelectedIdTypes(e.target.value)}
                            className="block w-full p-3 rounded-md border border-blue-200 text-gray-700 bg-white shadow-sm"
                          >
                            <option value="">
                              {t(
                                "newRequest.representativeDetails.placeholders.idType"
                              )}
                            </option>

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
                              {t("newRequest.representativeDetails.idFront")}{" "}
                              <span className="text-red-500">*</span>
                            </h3>
                            <div
                              {...getRootPropsId()}
                              className={`border-2 border-dashed ${validator.errorMessages.representativeIdFile
                                ? "border-red-500"
                                : "border-gray-300"
                                } p-5 text-center rounded-md cursor-pointer ${sameAsApplicant
                                  ? "pointer-events-none opacity-50"
                                  : ""
                                }`}
                            >
                              <input
                                {...getInputPropsId({
                                  accept: ".pdf,.png,.jpg,.jpeg",
                                  onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const isValid = validateFile(file);
                                      if (isValid) {
                                        setRepresentativeIdFile(file);
                                      }
                                    }
                                  },
                                })}
                              />
                              <p className="text-sm text-gray-500">
                                {t(
                                  "newRequest.representativeDetails.fileUpload.idFrontPrompt"
                                )}
                              </p>
                            </div>

                            {validator.message(
                              "representativeIdFile",
                              representativeIdFile,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.representativeDetails.validation.idFrontRequired"
                                  ),
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
                                    {representativeIdFile.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    (
                                    {(
                                      representativeIdFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </span>
                                  {sameAsApplicant === false && (
                                    <button
                                      onClick={() =>
                                        handleFileRemoval(
                                          representativeIdFile.name,
                                          "representativeId"
                                        )
                                      }
                                      className="text-indigo-800 mx-3 hover:underline"
                                    >
                                      {t(
                                        "newRequest.representativeDetails.fileUpload.remove"
                                      )}
                                    </button>
                                  )}
                                </div>
                                {!validateFile(representativeIdFile) && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {t(
                                      "newRequest.representativeDetails.validation.fileInvalid"
                                    )}
                                  </p>
                                )}
                              </div>
                            )}

                            {!representativeIdFile && (
                              <p className="text-sm text-gray-500">
                                {t(
                                  "newRequest.representativeDetails.placeholders.noFileSelected"
                                )}
                              </p>
                            )}
                          </div>

                          <div className="border-b-2 border-gray-200 pb-4 mb-4">
                            <h3 className="text-base font-medium text-gray-800">
                              {t("newRequest.representativeDetails.idBack")}{" "}
                              <span className="text-red-500">*</span>
                            </h3>
                            <div
                              {...getRootPropsIdBack()}
                              className={`border-2 border-dashed ${validator.errorMessages.representativeIdBackFile
                                ? "border-red-500"
                                : "border-gray-300"
                                } p-5 text-center rounded-md cursor-pointer ${sameAsApplicant
                                  ? "pointer-events-none opacity-50"
                                  : ""
                                }`}
                            >
                              <input
                                {...getInputPropsIdBack({
                                  accept: ".pdf,.png,.jpg,.jpeg",
                                  onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const isValid = validateFile(file);
                                      if (isValid) {
                                        setRepresentativeIdBackFile(file);
                                      }
                                    }
                                  },
                                })}
                              />
                              <p className="text-sm text-gray-500">
                                {t(
                                  "newRequest.representativeDetails.fileUpload.idBackPrompt"
                                )}
                              </p>
                            </div>

                            {validator.message(
                              "representativeIdBackFile",
                              representativeIdBackFile,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.representativeDetails.validation.idBackRequired"
                                  ),
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
                                    {representativeIdBackFile.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    (
                                    {(
                                      representativeIdBackFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </span>
                                  {sameAsApplicant === false && (
                                    <button
                                      onClick={() =>
                                        handleFileRemoval(
                                          representativeIdBackFile.name,
                                          "representativeIdBack"
                                        )
                                      }
                                      className="text-indigo-800 mx-3 hover:underline"
                                    >
                                      {t(
                                        "newRequest.representativeDetails.fileUpload.remove"
                                      )}
                                    </button>
                                  )}
                                </div>
                                {!validateFile(representativeIdBackFile) && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {t(
                                      "newRequest.representativeDetails.validation.fileInvalid"
                                    )}
                                  </p>
                                )}
                              </div>
                            )}

                            {!representativeIdBackFile && (
                              <p className="text-sm text-gray-500">
                                {t(
                                  "newRequest.representativeDetails.placeholders.noFileSelected"
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {sameAsApplicant === false && (
                          <div className="flex-1 space-y-4 border-b-2 border-gray-200 pb-4 mb-4">
                            <h3 className="text-base font-medium text-gray-800">
                              {t("newRequest.representativeDetails.letter")}
                            </h3>
                            <div
                              {...getRootPropsLetter()}
                              className={`border-2 border-dashed ${validator.errorMessages.representationLetterFile
                                ? "border-red-500"
                                : "border-gray-300"
                                } p-5 text-center rounded-md cursor-pointer`}
                            >
                              <input
                                {...getInputPropsLetter({
                                  accept: ".pdf,.png,.jpg,.jpeg",
                                  onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      if (validateFile(file)) {
                                        setRepresentationLetterFile(file);
                                      }
                                    }
                                  },
                                })}
                              />
                              <p className="text-sm text-gray-500">
                                {t(
                                  "newRequest.representativeDetails.fileUpload.letterPrompt"
                                )}
                              </p>
                            </div>
                            {validator.message(
                              "representationLetterFile",
                              representationLetterFile,
                              "required",
                              {
                                messages: {
                                  required: t(
                                    "newRequest.representativeDetails.validation.letterRequired"
                                  ),
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}

                            {representationLetterFile ? (
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
                                    {representationLetterFile.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    (
                                    {(
                                      representationLetterFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB)
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleFileRemoval(
                                        representationLetterFile.name,
                                        "representationLetter"
                                      )
                                    }
                                    className="text-indigo-800 mx-3 hover:underline"
                                  >
                                    {t(
                                      "newRequest.representativeDetails.fileUpload.remove"
                                    )}
                                  </button>
                                </div>
                                {!validateFile(representationLetterFile) && (
                                  <p className="text-red-500 text-xs mt-1">
                                    Invalid file type or size (must be PDF, PNG,
                                    JPG under 5MB)
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                {t(
                                  "newRequest.representativeDetails.placeholders.noFileSelected"
                                )}
                              </p>
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
                <div
                  style={{
                    height: respondents.length > 1 ? "600px" : "auto",
                    display: "flex",
                    flexDirection: "column",
                    overflow: respondents.length > 1 ? "hidden" : "visible",
                  }}
                  className="overflow-y-auto scrollbar-hide touch-pan-y"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="mb-8">
                      <Typography
                        variant="h6"
                        className="text-lg font-semibold text-gray-700"
                      >
                        {t("newRequest.respondentDetails.title")}
                      </Typography>
                      <Typography
                        variant="body1"
                        className="text-gray-600 mt-2"
                      >
                        {t("newRequest.respondentDetails.description")}
                      </Typography>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddRespondent}
                      color={sidenavColor}
                      variant="text"
                    >
                      + {t("newRequest.respondentDetails.addRespondent")}
                    </Button>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "none" /* Firefox */,
                      msOverflowStyle: "none" /* IE and Edge */,
                    }}
                    className="scrollbar-hide"
                  >
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
                              {t("newRequest.respondentDetails.remove")}
                            </Button>
                          </div>
                        )}
                        {respondents.length > 1 && (
                          <div className="absolute top-0 left-0">
                            <div className="text-[14px] font-semibold">
                              {t(
                                "newRequest.respondentDetails.respondentIndex"
                              )}{" "}
                              {index + 1}
                            </div>
                          </div>
                        )}
                        <div
                          className={`space-y-6 w-full ${respondents.length > 1 ? "pt-14" : ""
                            }`}
                        >
                          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                            <div className="w-full md:w-1/3">
                              <Typography
                                variant="small"
                                className="mb-3 font-semibold text-gray-700"
                              >
                                {t("newRequest.respondentDetails.name")}{" "}
                                <span className="text-red-500">*</span>
                              </Typography>
                              <Input
                                placeholder={t(
                                  "newRequest.respondentDetails.placeholders.name"
                                )}
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
                                className={`w-full px-4 py-3 border ${validator.errorMessages[
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
                                    required: t(
                                      "newRequest.respondentDetails.validation.nameRequired"
                                    ),
                                    alpha_space: t(
                                      "newRequest.respondentDetails.validation.nameAlpha"
                                    ),
                                    min: t(
                                      "newRequest.respondentDetails.validation.nameMin"
                                    ),
                                    max: t(
                                      "newRequest.respondentDetails.validation.nameMax"
                                    ),
                                  },
                                }
                              )}
                            </div>

                            <div className="w-full md:w-1/3">
                              <Typography
                                variant="small"
                                className="mb-3 font-semibold text-gray-700"
                              >
                                {t("newRequest.respondentDetails.phoneNumber")}{" "}
                              </Typography>

                              <div className="relative">
                                <Input
                                  placeholder={t(
                                    "newRequest.respondentDetails.placeholders.phoneNumber"
                                  )}
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
                                  className={`pl-16 pr-4 py-2 w-full border rounded-lg shadow-sm ${validator.errorMessages[
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
                                "regex:^\\+251[1-9][0-9]{8}$",
                                {
                                  messages: {
                                    regex: t(
                                      "newRequest.respondentDetails.validation.phoneNumberRegex"
                                    ),
                                  },
                                  className: "text-red-500 text-xs mt-1",
                                }
                              )}
                            </div>

                            {/* <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.respondentDetails.region")}{" "}
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
                                {t(
                                  "newRequest.respondentDetails.placeholders.region"
                                )}
                              </option>
                              {regions.map((region) => (
                                <option key={region.id} value={region.id}>
                                  {region.name}
                                </option>
                              ))}
                            </select>
                          </div> */}
                            <div className="w-full md:w-1/3">
                              <Typography
                                variant="small"
                                className="mb-3 font-semibold text-gray-700"
                              >
                                {t("newRequest.respondentDetails.otherAddress")}
                              </Typography>
                              <Input
                                placeholder={t(
                                  "newRequest.respondentDetails.placeholders.otherAddress"
                                )}
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

                          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                            {/* Zone Select */}
                            {/* <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.respondentDetails.zone")}{" "}
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
                              <option value="">
                                {t(
                                  "newRequest.respondentDetails.placeholders.zone"
                                )}
                              </option>
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
                                messages: {
                                  required: t(
                                    "newRequest.respondentDetails.validation.zoneRequired"
                                  ),
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div> */}

                            {/* Woreda Select */}
                            {/* <div className="w-full md:w-1/3">
                            <Typography
                              variant="small"
                              className="mb-3 font-semibold text-gray-700"
                            >
                              {t("newRequest.respondentDetails.woreda")}{" "}
                              <span className="text-red-500">*</span>
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
                              <option value="">
                                {t(
                                  "newRequest.respondentDetails.placeholders.woreda"
                                )}
                              </option>
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
                                messages: {
                                  required: t(
                                    "newRequest.respondentDetails.validation.woredaRequired"
                                  ),
                                },
                                className: "text-red-500 text-xs mt-1",
                              }
                            )}
                          </div> */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                          {t("newRequest.complaintDetails.title")}
                        </Typography>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            {t(
                              "newRequest.complaintDetails.courtCaseResultReference"
                            )}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            placeholder={t(
                              "newRequest.complaintDetails.placeholders.courtCaseResultReference"
                            )}
                            name="court_case_result_reference"
                            onChange={(e) => {
                              setCourtCaseResultReference(e.target.value);
                              validator.showMessageFor(
                                "court_case_result_reference"
                              );
                            }}
                            value={courtCaseResultReference}
                            className={`w-full px-4 py-3 border rounded-lg shadow-sm ${validator.errorMessages
                              .court_case_result_reference
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                            containerProps={{
                              className: "min-w-full",
                            }}
                          />
                          {validator.message(
                            "court_case_result_reference",
                            courtCaseResultReference,
                            "required",
                            {
                              messages: {
                                required: t(
                                  "newRequest.complaintDetails.validation.courtCaseResultReferenceRequired"
                                ),
                              },
                              className: "text-red-500 text-xs mt-1",
                            }
                          )}
                        </div>

                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            {t("newRequest.complaintDetails.caseType")}{" "}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <select
                            value={caseTypeId}
                            onChange={(e) => {
                              setCaseTypeId(e.target.value);
                              validator.showMessageFor("case_type_id");
                            }}
                            className={`w-full p-3 border rounded-lg shadow-sm ${validator.errorMessages.case_type_id
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                          >
                            <option value="">
                              {t(
                                "newRequest.complaintDetails.placeholders.caseType"
                              )}
                            </option>
                            {caseTypes.map((type) => (
                              <option
                                key={type.case_type_id}
                                value={type.case_type_id}
                              >
                                {type.name}
                              </option>
                            ))}
                          </select>
                          {validator.message(
                            "case_type_id",
                            caseTypeId,
                            "required",
                            {
                              messages: {
                                required: t(
                                  "newRequest.complaintDetails.validation.caseTypeRequired"
                                ),
                              },
                              className: "text-red-500 text-xs mt-1",
                            }
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4 mt-4">
                        <Typography
                          variant="h6"
                          className="text-lg font-semibold text-gray-700"
                        >
                          {t(
                            "newRequest.complaintDetails.violatedConstitutionArticleSection"
                          )}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            {t(
                              "newRequest.complaintDetails.violatedConstitutionArticle"
                            )}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            placeholder={t(
                              "newRequest.complaintDetails.placeholders.violatedConstitutionArticle"
                            )}
                            name="violated_constitution_article"
                            onChange={(e) => {
                              setViolatedConstitutionArticle(e.target.value);
                              validator.showMessageFor(
                                "violated_constitution_article"
                              );
                            }}
                            value={violatedConstitutionArticle}
                            className={`w-full px-4 py-3 border rounded-lg shadow-sm ${validator.errorMessages
                              .violated_constitution_article
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                            containerProps={{
                              className: "min-w-full",
                            }}
                          />
                          {validator.message(
                            "violated_constitution_article",
                            violatedConstitutionArticle,
                            "required",
                            {
                              messages: {
                                required: t(
                                  "newRequest.complaintDetails.validation.violatedConstitutionArticleRequired"
                                ),
                              },
                              className: "text-red-500 text-xs mt-1",
                            }
                          )}
                        </div>
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            {t("newRequest.complaintDetails.affairDescription")}
                            <span className="text-red-500">*</span>
                          </Typography>
                          <textarea
                            onChange={(e) => {
                              setAffairDescription(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                              validator.showMessageFor("affair_description");
                            }}
                            value={affairDescription}
                            id="affair_description"
                            className={`w-full px-4 py-3 border rounded-lg shadow-sm ${validator.errorMessages.affair_description
                              ? "border-red-500"
                              : "border-gray-300"
                              }`}
                            placeholder={t(
                              "newRequest.complaintDetails.placeholders.affairDescription"
                            )}
                          />
                          {validator.message(
                            "affair_description",
                            affairDescription,
                            "required",
                            {
                              messages: {
                                required: t(
                                  "newRequest.complaintDetails.validation.affairDescriptionRequired"
                                ),
                              },
                              className: "text-red-500 text-xs mt-1",
                            }
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-4">
                        <Typography
                          variant="h6"
                          className="text-lg font-semibold text-gray-700"
                        >
                          {t(
                            "newRequest.complaintDetails.otherLawsAndSummarySection"
                          )}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Typography
                            variant="small"
                            className="mb-2 text-left font-medium text-gray-600"
                          >
                            {t(
                              "newRequest.complaintDetails.otherApplicableLaws"
                            )}
                          </Typography>
                          <Input
                            color="gray"
                            size="lg"
                            placeholder={t(
                              "newRequest.complaintDetails.placeholders.otherApplicableLaws"
                            )}
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
                            {t(
                              "newRequest.complaintDetails.constitutionalComplaintSummary"
                            )}
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
                            placeholder={t(
                              "newRequest.complaintDetails.placeholders.constitutionalComplaintSummary"
                            )}
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
                          {t("newRequest.attachDocuments.title")}
                          <span className="text-red-500">*</span>
                        </Typography>
                      </div>

                      <div
                        {...getRootPropsComplaint()}
                        className={`border-2 border-dashed ${validator.errorMessages.complaint_document_files ||
                          complaintDocumentFiles.some(
                            (file) => !validateFile(file)
                          )
                          ? "border-red-500"
                          : "border-gray-300"
                          } p-5 text-center rounded-md cursor-pointer`}
                      >
                        <input
                          {...getInputPropsComplaint({
                            accept: ".pdf,.png,.jpg,.jpeg",
                          })}
                        />
                        <p className="text-sm text-gray-500">
                          Drag or click to select files (PDF, PNG, JPG up to
                          5MB)
                        </p>
                      </div>
                      {validator.message(
                        "complaint_document_files",
                        complaintDocumentFiles,
                        "required|array|min:1,array",
                        {
                          messages: {
                            required: t(
                              "newRequest.attachDocuments.validation.filesRequired"
                            ),
                            array: t("validation.array"),
                            "min.array": t(
                              "newRequest.attachDocuments.validation.minFiles"
                            ),
                          },
                          className: "text-red-500 text-xs mt-1",
                        }
                      )}

                      {complaintDocumentFiles.length > 0 ? (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {" "}
                            <span className="text-sm text-gray-500">
                              {complaintDocumentFiles.length} file
                              {complaintDocumentFiles.length !== 1
                                ? "s"
                                : ""}{" "}
                              selected
                            </span>
                          </h4>
                          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2">
                            <ul className="space-y-2">
                              {complaintDocumentFiles.map((file) => (
                                <li
                                  key={file.name}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center min-w-0">
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewFile(file);
                                        setIsPreviewModalOpen(true);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline truncate"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                      ({(file.size / (1024 * 1024)).toFixed(2)}{" "}
                                      MB)
                                    </span>
                                  </div>
                                  <div>
                                    {!validateFile(file) && (
                                      <span className="text-red-500 text-xs mr-2 whitespace-nowrap">
                                        {t(
                                          "newRequest.attachDocuments.validation.fileInvalid"
                                        )}
                                      </span>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleFileRemoval(
                                          file.name,
                                          "complaintDocument"
                                        )
                                      }
                                      className="text-indigo-800 hover:underline whitespace-nowrap"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {t("newRequest.attachDocuments.noFilesSelected")}
                        </p>
                      )}
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
                            <div className="p-3 flex items-center gap-3 hover:bg-gray-50">
                              {representativeIdFile ? (
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
                                    {representativeIdFile.name}
                                  </Typography>
                                  <span className="ml-auto text-xs text-gray-500">
                                    {(
                                      representativeIdFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <DocumentIcon className="h-5 w-5 flex-shrink-0" />
                                  <Typography
                                    variant="body1"
                                    className="font-medium"
                                  >
                                    No ID front uploaded
                                  </Typography>
                                </div>
                              )}
                            </div>

                            <div className="p-3 flex items-center gap-3 hover:bg-gray-50">
                              {representativeIdBackFile ? (
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
                                    {representativeIdBackFile.name}
                                  </Typography>
                                  <span className="ml-auto text-xs text-gray-500">
                                    {(
                                      representativeIdBackFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <DocumentIcon className="h-5 w-5 flex-shrink-0" />
                                  <Typography
                                    variant="body1"
                                    className="font-medium"
                                  >
                                    No ID back uploaded
                                  </Typography>
                                </div>
                              )}
                            </div>
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
                                      {representationLetterFile.name}
                                    </Typography>
                                  </div>
                                  <span className="ml-auto text-xs text-gray-500">
                                    {(
                                      representationLetterFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // <div className="bg-gray-50 p-4 rounded-lg text-center">
                              //   <Typography variant="body1" className="text-gray-500">
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
                        Selected Files ({complaintDocumentFiles.length})
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
                                <DocumentIcon className="h-5 w-5  flex-shrink-0" />
                                <Typography
                                  variant="body1"
                                  className="font-medium  truncate"
                                >
                                  {file.name}
                                </Typography>
                              </div>
                              <span className="ml-auto text-xs text-gray-500">
                                {Math.round(file.size / 1024)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <Typography variant="body1" className="text-gray-500">
                            No files attached
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
                  ${activeStep === 0
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

              {(isButtonDisabled === false) &&
                (<Typography
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
                  ${activeStep === steps.length - 1
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
                  {activeStep === steps.length - 1 && isTermsAccepted
                    ? "Submit"
                    : "Next"}
                </Typography>)}

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
        <PreviewModal
          file={previewFile}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}

      {isTermsModalOpen && (
        <TermsAndConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          onAccept={handleAcceptTerms}
        />
      )}
    </section>
  );
}

export default NewRequestForm;
