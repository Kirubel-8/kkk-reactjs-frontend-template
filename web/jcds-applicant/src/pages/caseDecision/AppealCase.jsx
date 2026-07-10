import appealService from "@/service/appeal.service";
import { Divider, Modal, Typography } from "@mui/material";
import { Box } from "@mui/system";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { toast, ToastContainer, Zoom } from "react-toastify";
// import logo from "/cfms-customer/img/cci_logo.png";
// import image_1 from '/cfms-customer/img/signature/image_1.jpg';
// import image_2 from '/cfms-customer/img/signature/image_2.jpg';
// import image_3 from '/cfms-customer/img/signature/image_3.jpg';
import { Button } from "@material-tailwind/react";
const AppealCase = ({
  referenceNumber,
  archiveNumber,
  reportedDate,
  decisionDate,
  caseId,
  appeal,
  requestsData,
}) => {
  const [hasAppeal, setHasAppeal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef();
  const handleCheckboxChange = () => {
    setHasAppeal(!hasAppeal);
  };
  const [appealDocumentModal, setAppealDocumentModal] = useState({
    open: false,
    isGenerating: false,
    createdAt: '',
    referenceNumber: '',
    reportedDate: '',
    requestsData: {
      applicantNames: '',
      respondentNames: ''
    },
    // reportedDate: '',
    pageData: {
      councilDecisionPageCount: '',
      requestComplaintDocumentCount: '',
      additionalEvidenceDocumentCount: ''
    }
  });
  const handleCloseAppealDocumentModal = () => {
    setAppealDocumentModal(prev => ({
      ...prev,
      open: false
    }));
  };

  useEffect(() => {
    if (appeal) {
      setHasAppeal(true);
      setSubmitted(true);
    }
  }, [appeal]);

  const Header = () => (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        m={1}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            color: "#4169a5",
            whiteSpace: "pre-line",
            textAlign: "center",
            mt: 2,
            fontSize: "12px",
          }}
        >
          የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ {"\n"}
          ሪፐብሊክ {"\n"}
          የሕገ መንግስት ጉዳዮች {"\n"}
          አጣሪ ጉባኤ ጽ/ቤት
        </Typography>
        <img src={logo} alt="Company Logo" style={{ width: "140px" }} />
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            color: "#4169a5",
            whiteSpace: "pre-line",
            textAlign: "center",
            fontFamily: "Times New Roman, Times, serif",
            mt: 2,
            fontSize: "12px",
          }}
        >
          The Federal Democratic Republic{"\n"}
          of Ethiopia {"\n"}
          Secretariat of {"\n"}
          Council of Constitutional Inquiry
        </Typography>
      </Box>
      <Divider
        sx={{
          borderBottomWidth: 3,
          borderBottom: "4px solid rgba(250, 230, 52, 0.5)",
          mb: 1,
          width: "98%",
          alignSelf: "center",
        }}
      />
    </>
  );

  const Footer = () => {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "4px solid rgba(250, 230, 52, 0.5)",
            marginTop: "130px"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              gap: 1,
              flex: 1,
              borderRight: "4px solid rgba(250, 230, 52, 0.5)",
              p: 1,
            }}
          >
            <Typography
              fontWeight="bold"
              sx={{
                color: "#4169a5",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
              component="pre"
            >
              ስልክ/Tel: +251 11-1-116888{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: +251 11-1-562289{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: +251 11-1-266724
              <h6
                style={{
                  fontWeight: "bold",
                  color: "#4169a5",
                  fontFamily: "Times New Roman, Times, serif",
                  fontSize: "10px",
                }}
              >
                {"\n"}ነፃ የስልክ መስመር:&nbsp;&nbsp;6939
              </h6>
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1.2,
              borderRight: "4px solid rgba(32, 32, 26, 0.5)",
              textAlign: "center",
              fontSize: "12px",
            }}
          >
            <Typography
              fontWeight="bold"
              sx={{
                mt: 1,
                fontSize: "12px",
                color: "#4169a5",
                whiteSpace: "pre-line",
                fontFamily: "Times New Roman, Times, serif",
                textAlign: "center",
              }}
            >
              ፋክስ/Fax: +251 11-1-116888{"\n"}
              ፓ.ሳ.ቁ/P.O.Box: 22627{"\n"}
              አዲስ አበባ{"\n"}
              Addis Ababa
            </Typography>
          </Box>
          <Box sx={{ flex: 2, p: 1 }}>
            <Typography
              fontWeight="bold"
              sx={{
                color: "#4169a5",
                fontSize: "12px",
                whiteSpace: "pre-line",
                fontFamily: "Times New Roman, Times, serif",
                textAlign: "center",
              }}
            >
              ኢ-ሜይል/E-mail: constitutionalinquiry.et@gmail.com{"\n"}
              ድረ-ገፅ/Website: www.cci.gov.et{"\n"}
              ፌስቡክ-ገፅ: http://www.facebook.com/CCIFDRE/{"\n"}
              ቴሌግራም/Telegram: https://t.me/CCI-sec
            </Typography>
          </Box>
        </Box>
      </>
    );
  };

  const generateAppealContent = () => {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          width: "794px",
          minHeight: "1123px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          lineHeight: "1.8",
          position: "relative"
        }}
      >
        <Header />

        <div style={{ flex: 1, padding: "40px", }}>
          <div
            style={{
              marginBottom: "30px",
              marginLeft: "450px"
            }}
          >
            <div style={{
              fontWeight: "bold",
              color: "#4169a5",
              marginTop: "8px",
              width: "fit-content",
              textAlign: "left"
            }}>
              <div>ቁጥር</div>
              Ref. No:{" "}
              <span style={{
                textDecoration: "underline",
                textDecorationColor: "orange",
                color: "black",
                fontWeight: "bold",
                paddingLeft: "8px",
                paddingRight: "8px"
              }}>
                {appealDocumentModal.referenceNumber}
              </span>
            </div>
            <div style={{
              fontWeight: "bold",
              color: "#4169a5",
              marginTop: "8px",
              width: "fit-content",
              textAlign: "left"
            }}>
              <div>ቀን</div>
              Date:{" "}
              <span style={{
                textDecoration: "underline",
                textDecorationColor: "orange",
                color: "black",
                fontWeight: "bold",
                paddingLeft: "8px",
                paddingRight: "8px"
              }}>
                {appealDocumentModal.createdAt ? new Date(appealDocumentModal.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <h2
            style={{
              textAlign: "start",
              marginBottom: "30px",
              fontWeight: "bold",
            }}
          >
            በኢ.ፌ.ዴ.ሪ የፌዴሬሽን ምክር ቤት <br />
            አዲስ አበባ
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <p>
              <span>አመልካች{" "}</span>
              <span className="underline decoration-orange-400 text-black font-bold px-2">
                {appealDocumentModal.requestsData.applicantNames}
              </span>
            </p>

            <p>
              ተጠሪ{" "}
              <span className="underline decoration-orange-400 text-black font-bold px-2">
                {appealDocumentModal.requestsData.respondentNames}
              </span>
            </p>
          </div>

          <p>
            አመልካች ለሕገ መንግስት ጉዳዮች አጣሪ ጉባኤ ያቀረቡበት የሕገ መንግስት ትርጉም ጠያቄ ላይ ጉባኤ በ
            <span style={{ textDecoration: "underline", margin: "0 5px" }}>
              {new Date(appealDocumentModal.reportedDate).toLocaleDateString()}
            </span>{" "}
            ዓ.ም በሰጠው ውሳኔ ቅርብ በመሰኘት ይግባኝ ለማቅረብ መዝገቡ ተገልብጦ እንዲሰጣቸው በቀን{" "}
            <span style={{ textDecoration: "underline", margin: "0 5px" }}>
              {appealDocumentModal.createdAt ? new Date(appealDocumentModal.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </span>{" "}
            ዓ.ም በተፃው ማመልከቻ በጠየቁት መሰረት፡፡
          </p>

          <div
            style={{
              marginLeft: "30px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px', }}>
              1. የጉባኤ ውሳኔ ከሸኚ ጋር
              <span>
                {appealDocumentModal.pageData.councilDecisionPageCount ? (<span style={{
                  borderBottom: '1px dashed black',
                  flexGrow: 1,
                  margin: '0 8px',
                  padding: '0 20px',
                }}>{appealDocumentModal.pageData.councilDecisionPageCount}</span>) : '______________________'}
                <span> ገጽ</span></span>
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              2. የአመልካች አቤቱታ የፍ/ቤት ውሳኔዎች
              <span>
                {appealDocumentModal.pageData.requestComplaintDocumentCount ? (<span style={{
                  borderBottom: '1px dashed black',
                  flexGrow: 1,
                  margin: '0 8px',
                  padding: '0 20px',
                }}>{appealDocumentModal.pageData.requestComplaintDocumentCount}</span>) : '______________________'}
                <span> ገጽ</span></span>
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              3. ልዩ ልዩ ማመልከቻዎችና ማስረጃዎችን
              <span>
                {appealDocumentModal.pageData.additionalEvidenceDocumentCount ? (<span style={{
                  borderBottom: '1px dashed black',
                  flexGrow: 1,
                  margin: '0 8px',
                  padding: '0 20px',
                }}>{appealDocumentModal.pageData.additionalEvidenceDocumentCount}</span>) : '______________________'}
                <span> ገጽ</span></span>
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              4. ጠቅላላ ድምር
              <span>
                {(
                  <span style={{
                    borderBottom: '1px dashed black',
                    flexGrow: 1,
                    margin: '0 8px',
                    padding: '0 20px',
                  }}>
                    {(() => {
                      const getValidNumber = (value) =>
                        typeof value === 'number' && !isNaN(value) ? value : 0;

                      const a = getValidNumber(appealDocumentModal.pageData?.councilDecisionPageCount);
                      const b = getValidNumber(appealDocumentModal.pageData?.requestComplaintDocumentCount);
                      const c = getValidNumber(appealDocumentModal.pageData?.additionalEvidenceDocumentCount);

                      const hasValidNumber = [
                        appealDocumentModal.pageData?.councilDecisionPageCount,
                        appealDocumentModal.pageData?.requestComplaintDocumentCount,
                        appealDocumentModal.pageData?.additionalEvidenceDocumentCount
                      ].some(val => typeof val === 'number' && !isNaN(val));

                      return hasValidNumber ? a + b + c : 'N/A';
                    })()}
                  </span>
                )}
                <span> ገጽ</span></span>
            </p>
          </div>

          <p style={{ marginLeft: "200px" }}>ከዚህ ሸኝ ጋር አያይዘን የላክን መሆኑን እንገልፃለን።</p>


          <div style={{ marginTop: "150px", textAlign: "right" }}>
            <p>ከሰላምታ ጋር፡</p>
          </div>

          {appealDocumentModal.status === 'APPROVED' && (
            <div style={{
              position: 'absolute',
              bottom: '100px',
              right: '2px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '20px',
              marginBottom: "100px",
            }}>
              <img src={image_1} alt="Signature 1" style={{ width: '200px', height: 'auto' }} />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <img src={image_3} alt="Signature 3" style={{ width: '100px', height: 'auto' }} />
                <img src={image_2} alt="Signature 2" style={{ width: 'auto', height: 'auto' }} />
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    );
  };

  const generatePdf = async () => {
    setIsGenerating(true);

    try {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.zIndex = "-1000";
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(generateAppealContent());

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      root.unmount();
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      const pdfBlob = pdf.output("blob");

      return pdfBlob;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }

  };

  const handleViewAppealDocument = (appeal) => {
    console.log(appeal)
    setAppealDocumentModal({
      open: true,
      isGenerating: false,
      referenceNumber: appeal.reference_number,
      createdAt: appeal.createdAt,
      requestsData: {
        applicantNames: appeal.request.applicantNames || '',
        respondentNames: appeal.request.respondentNames || ''
      },
      reportedDate: appeal.decision_date,
      pageData: {
        councilDecisionPageCount: appeal.council_decision_page_count,
        requestComplaintDocumentCount: appeal.request_complaint_document_count,
        additionalEvidenceDocumentCount: appeal.additional_evidence_document_count
      },
      status: appeal.status
    });

  };

  const handleSubmit = async () => {
    if (!hasAppeal || submitted || isGenerating) return;

    try {

      const pdfBlob = await generatePdf();

      // const pdfUrl = URL.createObjectURL(pdfBlob);
      // window.open(pdfUrl);

      // Prepare form data for upload
      const formData = new FormData();
      formData.append("case_id", caseId);
      formData.append("files", pdfBlob, "appeal_document.pdf");

      // Upload PDF
      const uploadResponse = await appealService.attachFile(formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadResponse.status === 201) {
        const appealData = {
          file_path: uploadResponse.file_path[0],
          qrCode: uploadResponse.qrCode,
          case_id: caseId,
          archive_number: archiveNumber,
          reported_date: reportedDate,
          decision_date: new Date(),
        };

        const appealResponse = await appealService.createAppeal(appealData);

        if (appealResponse.status === 200 || appealResponse.status === 201) {
          setSubmitted(true);
          setHasAppeal(true);
          toast.success("Appeal submitted successfully", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
            transition: Zoom,
          });
        } else {
          throw new Error("Failed to create appeal record");
        }
      } else {
        throw new Error("Failed to upload PDF");
      }
    } catch (error) {
      console.error("Error submitting appeal:", error);
      toast.error("Failed to submit appeal. Please try again.");
    }
  };

  if (appeal?.status === 'APPROVED') {

    return (
      <>
        <div className="w-96 border border-gray-200 rounded-lg shadow-md h-full p-6 flex flex-col gap-6 items-center bg-white">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-[#28448C] text-xl font-bold">Appeal</h1>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Approved! </strong>
              <span className="block sm:inline">Your appeal has been approved.</span>
            </div>
            <button
              className="bg-green-600 transition-colors p-3 text-white rounded-lg w-40 font-medium shadow-md hover:bg-green-700"
              onClick={() => handleViewAppealDocument(appeal)}
            >
              View Appeal
            </button>
          </div>
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
        </div>
        <Modal
          open={appealDocumentModal.open}
          onClose={handleCloseAppealDocumentModal}
          aria-labelledby="appeal-document-modal"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '1000px',
            bgcolor: 'white',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6">
                Appeal Document Preview
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {appealDocumentModal.status === "APPROVED" && (<Button
                  variant="contained"
                  onClick={generatePdf}
                  disabled={appealDocumentModal.isGenerating}
                >
                  {appealDocumentModal.isGenerating ? 'Generating...' : 'Generate PDF'}
                </Button>)}

                <Button
                  variant="outlined"
                  onClick={handleCloseAppealDocumentModal}
                >
                  Close
                </Button>
              </Box>
            </Box>
            <Box sx={{
              bgcolor: '#fff',
              p: 2,
              border: '1px solid #ddd',
              borderRadius: 1
            }}>
              {generateAppealContent()}
            </Box>
          </Box>
        </Modal>
      </>
    );
  }

  {
    return (
      <div className="w-96 border border-gray-200 rounded-lg shadow-md h-full p-6 flex flex-col gap-6 items-center bg-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-[#28448C] text-xl font-bold">Appeal</h1>
          <p className="text-gray-600 text-center">
            Here is a section of an appeal for the decision
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-[#4475F2] rounded focus:ring-[#4475F2]"
              checked={hasAppeal}
              onChange={handleCheckboxChange}
              disabled={submitted}
            />
            <h1 className="text-[#2B3674] font-medium">I have an appeal</h1>
          </div>
        </div>

        <div className="border-2 border-gray-300 p-6 shadow-sm rounded-md w-full">
          <h1 className="text-[#2B3674] font-bold text-justify leading-relaxed">
            ይግባኝ /መዝገብ/ ግልባጭ እንዲሰጠኝ የቀረበ ማመለከቻ እኔ/እኛ አመልካች/ቾች በመዝገብ ቁጥር
            <span className="underline mx-2 text-blue-700 font-bold">
              {hasAppeal ? archiveNumber : "_________"}
            </span>
            በቀን
            <span className="underline mx-2 text-blue-700 font-bold">
              {hasAppeal ? reportedDate : "_________"}
            </span>
            ለሕገ መንግስት ጉዳዮች አጣሪ ጉባኤ ጽ/ቤት ባቀረብኩት / ነው አቤቱታ በጉዳዩ ላይ የሕገ መንግስት ትርጉም
            እንዲሰጥበት አቤቱታ አቅርቤ ጉባኤው ጉዳዩን ከመረመረ በኃላ የሕገ መንግስት ትርጉም አያስፈልገውም በማለት በቀን
            <span className="underline mx-2 text-blue-700 font-bold">
              {hasAppeal ? decisionDate : "_________"}
            </span>
            ውሳኔ ሰጥቷል፡፡ ሆኖም ጉባኤው በሰጠው ውሳኔ ቅር ስለተሰኘው/ን ይግባኝ ለፌዴሬሽን ምክር ቤት ለማቅረብ
            የመዝገብ ግላባጭ እንዲሰጠኝ/ እንዲሰጠን አመለክታለው/ እናመለክታለን፡፡
          </h1>
        </div>


        <button
          className={`${submitted ? "bg-green-600 hidden" : "bg-[#4475F2] hover:bg-blue-700"
            } transition-colors p-3 text-white rounded-lg w-40 font-medium shadow-md`}
          onClick={handleSubmit}
          disabled={submitted || !hasAppeal || isGenerating}
        >
          {isGenerating
            ? "Submitting ..."
            : submitted
              ? "Appeal Submitted"
              : "Appeal"}
        </button>

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
      </div>
    );
  }

};

export default AppealCase;

// import appealService from '@/service/appeal.service';
// import React, { useEffect, useRef, useState } from 'react';
// import { toast, ToastContainer, Zoom } from 'react-toastify';
// import jsPDF from "jspdf";
// import { Box } from '@mui/system';
// import { Paper, Typography } from '@mui/material';
// import html2canvas from "html2canvas";
// const AppealCase = ({ referenceNumber, reportedDate, decisionDate,caseId,appeal }) => {
//   const [hasAppeal, setHasAppeal] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [letterTemplate,setLetterTemplate]=useState();
//   const pdfRef = useRef();
//   const handleCheckboxChange = () => {
//     setHasAppeal(!hasAppeal);
//   };
//   useEffect(()=>{
//     if(appeal){
//       setHasAppeal(true)
//       setSubmitted(true);
//     }
//   })

//   const handleSubmit = async () => {
//     try {
//       // const handleSavePDF = async () => {
//         if (!pdfRef.current) {
//           console.error("pdfRef is null!");
//           handleShowSnackbar("No content available to generate PDF.", "error");
//           return;
//         }

//         // setIsDownloading(true);

//         const hiddenElements = document.querySelectorAll(".hide-on-download");
//         hiddenElements.forEach((el) => (el.style.display = "none"));

//         const pdf = new jsPDF("p", "mm", "a4");
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = pdf.internal.pageSize.getHeight();
//         const pages = Array.from(pdfRef.current.children);

//         if (pages.length === 0) {
//           console.error("No pages found in pdfRef!");
//           // handleShowSnackbar("No content available to generate PDF.", "error");
//           // setIsDownloading(false);
//           return;
//         }

//         const capturePage = (index) => {
//           if (index >= pages.length) {
//             const pdfBlob = pdf.output("blob");

//             const formData = new FormData();
//             formData.append("case_id", caseId);
//             formData.append("files", pdfBlob, "document.pdf");

//             uploadPdfToDatabase(formData);

//             hiddenElements.forEach((el) => (el.style.display = ""));
//             // setIsDownloading(false);
//             return;
//           }

//           const page = pages[index];

//           html2canvas(page, {
//             scale: 2,
//             useCORS: true,
//             allowTaint: true,
//             scrollY: -window.scrollY,
//           }).then((canvas) => {
//             const imgData = canvas.toDataURL("image/png");
//             const imgWidth = canvas.width;
//             const imgHeight = canvas.height;

//             const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 5) / imgHeight);
//             const newWidth = imgWidth * ratio;
//             const newHeight = imgHeight * ratio;

//             if (index > 0) {
//               pdf.addPage();
//             }

//             const xOffset = (pdfWidth - newWidth) / 2;
//             const yOffset = 5;

//             pdf.addImage(imgData, "PNG", xOffset, yOffset, newWidth, newHeight);

//             setTimeout(() => capturePage(index + 1), 150);
//           }).catch((error) => {
//             console.error("Error capturing page:", error);
//             handleShowSnackbar("Error capturing page.", "error");
//             setIsDownloading(false);
//           });
//         };

//         capturePage(0);

//       const uploadPdfToDatabase = async (formData) => {
//         for (let pair of formData.entries()) {
//         }

//         try {
//           const response = await appealService.attachFile(formData, {
//             headers: {
//               "Content-Type": "multipart/form-data",
//             },
//           });

//           if (response.status === 201) {
//             const appealData={
//         file_path:response.file_path,
//         qrCode:response.qrCode,
//         caseId,
//         referenceNumber,
//         reportedDate,
//         decisionDate
//       };

//         const response = await appealService.createAppeal(appealData)

//       if (response.status === 200 || response.status === 201) {

//         setSubmitted(true);
//         setHasAppeal(true);
//           toast.success("Appeal submitted successfully", {
//             position: "top-right",
//             autoClose: 2000,
//             hideProgressBar: false,
//             closeOnClick: true,
//             pauseOnHover: true,
//             draggable: true,
//             theme: "light",
//             transition: Zoom,
//           });

//           setTimeout(() => {
//             // window.location.reload();
//           }, 2500);

//       }else {
//         toast.error("Failed to submit appeal");
//         handleDeleteNavigation("/home/case-decision");
//       }
//           } else {
//             console.error('Error submitting appeal:', error);
//           }
//         } catch (error) {
//           console.error("Upload failed:", error);
//           console.error('Error submitting appeal:', error);
//         }
//       };

//     } catch (error) {
//       console.error('Error submitting appeal:', error);
//     }
//   };

// const header = ()=>{
//   return<>
//   <h1>Header content</h1>
//   </>
// }
// const footer = ()=>{
//   return<>
//   <h1>Footer content</h1>
//   </>
// }

//   const paperStyle = {
//     width: "794px",
//     minHeight: "1123px",
//     padding: "20px",
//     marginBottom: "30px",
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "start",
//   };

//   return (
//     <div className='w-96 border border-gray-200 rounded-lg shadow-md h-full p-6 flex flex-col gap-6 items-center bg-white'>
//       <div className='flex flex-col items-center justify-center space-y-4'>
//         <h1 className='text-[#28448C] text-xl font-bold'>Appeal</h1>
//         <p className='text-gray-600 text-center'>Here is a section of an appeal for the decision</p>
//         <div className='flex gap-3 items-center'>
//           <input
//             type='checkbox'
//             className='form-checkbox h-5 w-5 text-[#4475F2] rounded focus:ring-[#4475F2]'
//             checked={hasAppeal}
//             onChange={handleCheckboxChange}
//             disabled={submitted}
//           />
//           <h1 className='text-[#2B3674] font-medium'>I have an appeal</h1>
//         </div>
//       </div>

//       <div className='border-2 border-gray-300 p-6 shadow-sm rounded-md w-full'>
//         <h1 className='text-[#2B3674] font-bold text-justify leading-relaxed'>
//           ይግባኝ /መዝገብ/ ግልባጭ እንዲሰጠኝ የቀረበ ማመለከቻ
//           እኔ/እኛ አመልካች/ቾች በመዝገብ ቁጥር
//           <span className='underline mx-2 text-blue-700 font-bold'>
//             {hasAppeal ? referenceNumber : '_________'}
//           </span>
//           በቀን
//           <span className='underline mx-2 text-blue-700 font-bold'>
//             {hasAppeal ? reportedDate : '_________'}
//           </span>
//           ለሕገ መንግስት ጉዳዮች አጣሪ ጉባኤ ጽ/ቤት ባቀረብኩት / ነው አቤቱታ በጉዳዩ ላይ የሕገ መንግስት ትርጉም እንዲሰጥበት አቤቱታ አቅርቤ ጉባኤው ጉዳዩን ከመረመረ በኃላ የሕገ መንግስት ትርጉም አያስፈልገውም በማለት በቀን
//           <span className='underline mx-2 text-blue-700 font-bold'>
//             {hasAppeal ? decisionDate : '_________'}
//           </span>
//           ውሳኔ ሰጥቷል፡፡  ሆኖም ጉባኤው በሰጠው ውሳኔ ቅር ስለተሰኘው/ን ይግባኝ ለፌዴሬሽን ምክር ቤት ለማቅረብ የመዝገብ ግላባጭ እንዲሰጠኝ/ እንዲሰጠን አመለክታለው/ እናመለክታለን፡፡
//         </h1>
//       </div>

//       <button
//         className={`${
//           submitted ? 'bg-green-600' : 'bg-[#4475F2] hover:bg-blue-700'
//         } transition-colors p-3 text-white rounded-lg w-40 font-medium shadow-md`}
//         onClick={handleSubmit}
//         disabled={submitted || !hasAppeal}
//       >
//         {submitted ? 'Appeal Submitted' : 'Appeal'}
//       </button>

//        <ToastContainer
//               position="top-right"
//               autoClose={3000}
//               hideProgressBar={false}
//               newestOnTop={false}
//               closeOnClick
//               rtl={false}
//               pauseOnFocusLoss
//               draggable
//               pauseOnHover
//               theme="light"
//               transition={Zoom}
//             />

// <div className='hidden'>
// <Paper
//    ref={pdfRef}
//     sx={{
//   ...paperStyle,
//   minHeight: '1123px',
//   display: 'flex',
//   flexDirection: 'column',
//   justifyContent: 'space-between',
// }}
// >
//   <Box>
//        {header()}
//      <Typography fontSize={"24px"} variant="h1" fontWeight="bold" textAlign="center"marginTop={2}>
//                 <div>የኢ.ፌ.ዴ.ሪ የሕገ መንግሥት ጉዳዮች አጣሪ</div><br />
//                 <div>ጉባዔ ስብሰባ</div><br />
//                 <div>ቃለ ጉባዔ</div>
//                    <Box style={{marginTop: "550px",display:"flex",justifyContent:"flex-end" ,marginRight:"50px"}}>
//       {/* <Typography style={{fontSize:"24px"}}>{formattedMinuteDate}</Typography> */}

//                     </Box>
//               </Typography>
//   </Box>
//   <Box>
//         {footer(false)}
//   </Box>

//     </Paper>
// </div>
//     </div>
//   );
// };

// export default AppealCase;

// const getDocumentTemplate = async () => {
//   try{
//   const response = await appealService.getAllLetterTemplates();
//   setLetterTemplate({
//       header:response.header,
//       footer:response.footer
//     })
//   }
//   catch{
//   }
// }
//  useEffect(()=>{
//    getDocumentTemplate();
//   },[]);
