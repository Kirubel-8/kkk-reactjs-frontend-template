// src/components/About.jsx
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
import { RocketLaunchIcon, EyeIcon } from "@heroicons/react/24/outline";

const About = () => {
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
            About Us
          </Typography>
          <Typography
            variant="lead"
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            We are passionate about delivering innovative solutions that empower productivity and connectivity. Discover our mission, vision, and dedicated team.
          </Typography>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-600 animate-fade-in-up">
            <CardBody className="flex items-start gap-4">
              <RocketLaunchIcon className="h-8 w-8 text-blue-700 mt-1" />
              <div>
                <Typography variant="h3" className="text-2xl font-semibold text-blue-900 mb-3">
                  Our Mission
                </Typography>
                <Typography className="text-gray-600">
                  To empower businesses and individuals with seamless, user-friendly tools that streamline workflows and foster collaboration.
                </Typography>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-blue-600 animate-fade-in-up delay-100">
            <CardBody className="flex items-start gap-4">
              <EyeIcon className="h-8 w-8 text-blue-700 mt-1" />
              <div>
                <Typography variant="h3" className="text-2xl font-semibold text-blue-900 mb-3">
                  Our Vision
                </Typography>
                <Typography className="text-gray-600">
                  To create a world where technology simplifies complex processes, driving innovation across all industries.
                </Typography>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center animate-fade-in-up delay-200">
          
        </div>
      </div>
    </div>
  );
};

export default About;