// src/components/ContactUs.jsx
import { useState } from "react";
import { Button, Card, CardBody, Input, Textarea, Typography } from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline";

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-8 animate-fade-in">
          <NavLink to="/">
            <Button
              variant="text"
              color="blue"
              className="group flex items-center gap-2 text-blue-700 hover:bg-blue-100/50 rounded-full px-4 py-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500"
              aria-label="Back to Home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Button>
          </NavLink>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-in">
          <Typography
            variant="h1"
            className="text-4xl sm:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight"
          >
            በእዚህ ያግኙን
          </Typography>
          <Typography
            variant="lead"
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            ማንኛው ጥያቄ ወይም አስተያየት ካሎት ይጠይቁን !
          </Typography>
        </div>

        {/* Form and Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-600 animate-fade-in-up">
            <CardBody className="p-6">
              <Typography variant="h3" className="text-2xl font-semibold text-blue-900 mb-4">
               መልዕክት ካሎት
              </Typography>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="text"
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  color="blue"
                  className="w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                  containerProps={{ className: "mb-4" }}
                />
                <Input
                  type="email"
                  name="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  color="blue"
                  className="w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                  containerProps={{ className: "mb-4" }}
                />
                <Textarea
                  name="message"
                  label="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  color="blue"
                  className="w-full rounded-lg focus:ring-2 focus:ring-blue-500"
                  containerProps={{ className: "mb-4" }}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:ring-4 focus:ring-blue-300"
                >
                  Send Message
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-600 animate-fade-in-up delay-100">
            <CardBody className="p-6">
              <Typography variant="h3" className="text-2xl font-semibold text-blue-900 mb-4">
                በእነዚህ አማራጮች እኛን ማግኘት ይችላሉ
              </Typography>
              <Typography className="text-gray-600 mb-6">
                ከታች ካሉት አማራጮች አንዱን በመጠቀም የሚፈልጉትን መረጃ መጠየቅ ይችላሉ
              </Typography>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <EnvelopeIcon className="h-6 w-6 text-blue-700 mt-1" />
                  <div>
                    <Typography variant="small" className="font-semibold text-gray-800">
                      ኢሜል
                    </Typography>
                    <Typography className="text-gray-600">constitutionalinquiry.et@gmail.com</Typography>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <PhoneIcon className="h-6 w-6 text-blue-700 mt-1" />
                  <div>
                    <Typography variant="small" className="font-semibold text-gray-800">
                      ስልክ
                    </Typography>
                    <Typography className="text-gray-600">+251 456-7890</Typography>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPinIcon className="h-6 w-6 text-blue-700 mt-1" />
                  <div>
                    <Typography variant="small" className="font-semibold text-gray-800">
                     አድራሻ
                    </Typography>
                    <Typography className="text-gray-600">
                     አዲስ አበባ፡ ጉለሌ ክ/ከተማ፡ ወረዳ 02
                     6 ኪሎ ከምስካየ ኅዙናን መድኃኔዓለም ገዳም
                     ወደ መነን ትምህርት ቤት በሚወስደው
                      መንገድ 1ዐዐ ሜትር ገባ ብሎ

                    </Typography>
                  </div>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;