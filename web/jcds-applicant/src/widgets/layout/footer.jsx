import { Typography } from "@material-tailwind/react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-[clamp(8px,0.42vh,12px)]">
      <div className="flex w-full flex-wrap items-center justify-center gap-[clamp(16px,1.25vw,24px)] px-[clamp(8px,0.42vw,16px)] md:justify-between">
        <Typography variant="small" className="font-normal text-inherit" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(10px,0.625vw,12px)' }}>
          &copy; {year}{" "}
          <a
            href="https://www.fjacs.gov.et/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-500 font-bold"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Federal Judicial Administration Council Secretariat
          </a>
          . All Rights Reserved.
        </Typography>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  // No routes prop is required anymore
};

Footer.displayName = "/src/widgets/layout/footer.jsx";

export default Footer;
