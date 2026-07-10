import React from "react";
import AppStoreImage from "../../assets/images/App Store.png";
import PlayStoreImage from "../../assets/images/Play Store.png";
import AnnouncementImage from "../../assets/images/anouncement.png";

const AnnouncementPublic = () => {
  return (
    <div className="flex w-full overflow-hidden flex-col md:flex-row">
      {/* Left Section */}
      <div className="w-full md:w-1/2 flex items-start justify-center pt-[clamp(120px,15vh,230px)] px-[clamp(16px,4vw,32px)] md:pl-[clamp(120px,10.21vw,196px)] md:pr-[clamp(24px,2.5vw,32px)] order-2 md:order-1">
        <div className="flex flex-col max-w-[clamp(480px,50vw,650px)] w-full">
          {/* Heading */}
          <h1 
            className="text-[clamp(28px,4vw,64px)] leading-[clamp(36px,6vw,80px)] tracking-normal m-0"
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              color: '#215167'
            }}
          >
            {/* Design and build the product you always wanted */}
            Built for Mobile Built for You
          </h1>

          {/* Description Text */}
          <p 
            className="text-[clamp(14px,1.4vw,18px)] leading-[clamp(20px,2.4vw,28px)] tracking-normal m-0 mt-[clamp(12px,1.4vw,16px)]"
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 400,
              color: '#383838'
            }}
          >
            {/* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies molestie imperdiet. Cras rutrum vestibulum dolor, eu feugiat elit finibus a. Pellentesque vitae lacinia massa. */}
            Using our mobile app, you can submit reports quickly and securely, track updates, and manage your reports. The app is officially available on both the Play Store and the App Store, Download the app today and report anytime, anywhere with confidence.
          </p>

          {/* App Store Buttons */}
          <div className="flex mt-[clamp(24px,3vw,40px)] gap-[clamp(12px,2vw,24px)] flex-wrap">
            <button className="border-none bg-transparent p-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src={AppStoreImage}
                alt="Download on the App Store"
                className="h-auto max-h-[clamp(44px,6vw,60px)] w-auto"
              />
            </button>
            <button className="border-none bg-transparent p-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src={PlayStoreImage}
                alt="Get it on Google Play"
                className="h-auto max-h-[clamp(44px,6vw,60px)] w-auto"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 flex items-start justify-center pt-[clamp(96px,12vh,150px)] px-[clamp(16px,4vw,32px)] mb-[clamp(16px,2vh,32px)] order-1 md:order-2">
        <img
          src={AnnouncementImage}
          alt="Announcement"
          className="w-auto h-[53.52vh] object-contain opacity-100"
        />
      </div>
    </div>
  );
};

export default AnnouncementPublic;
