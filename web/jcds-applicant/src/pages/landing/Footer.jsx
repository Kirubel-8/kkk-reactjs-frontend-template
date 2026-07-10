import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start">
            <img 
              src="/cfms-customer/img/cci_logo.png" 
              alt="CCI Logo" 
              className="h-14 w-auto mb-4"
              loading="lazy"
            />
            <p className="text-gray-600 text-sm text-center md:text-left max-w-xs">
              Empowering businesses with innovative solutions since 2025. Committed to excellence and customer satisfaction.
            </p>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/services/incident-responder" 
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  Incident Responder
                </Link>
              </li>
              <li>
                <Link 
                  to="/services/payment-plans" 
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  Payment Plans
                </Link>
              </li>
              <li>
                <Link 
                  to="/services/secure-login" 
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  Secure Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>አድራሻ፦ <br></br>አዲስ አበባ፡ ጉለሌ ክ/ከተማ፡ ወረዳ 02 6 ኪሎ ከምስካየ ኅዙናን መድኃኔዓለም ገዳም ወደ መነን ትምህርት ቤት በሚወስደው
                   መንገድ 1ዐዐ ሜትር ገባ ብሎ ከላይ በምስሉ በሚታየው ባለ 5 ወለል ሕንፃ ላይ ያገኙናል፡፡
</li>
              <li>
                <a 
                  href="tel:+8802247171" 
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                 ድረ ገጽ፦ https://www.cci.gov.et
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contact@cci.com" 
                  className="text-red-500 hover:text-red-600 transition-colors duration-200"
                >
                 ኢሜል፦ contact@cci.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media and Copyright */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex justify-center space-x-6 mb-6">
            <a 
              href="https://facebook.com/cci" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              aria-label="Visit our Facebook page"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8v-7h-2v-2h2v-1.5c0-2.48 1.52-3.5 3-3.5h1.5v2h-1c-.55 0-1 .45-1 1v1.5h2l-.5 2h-1.5v7c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/cci" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              aria-label="Visit our Twitter page"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.56 8.56 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
              </svg>
            </a>
          </div>
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} CCI Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;