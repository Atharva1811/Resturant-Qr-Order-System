import { Link } from "react-router";
import Logo from "src/assets/images/logos/darklogo.svg";
import Logowhite from "src/assets/images/logos/whitelogo.svg";

const FullLogo = () => {
  return (
    <Link to={'/'} className="flex items-center gap-2 overflow-hidden py-1">
      {/* Dark Logo (shown in light mode) */}
      <img
        src={Logo}
        alt='Servora'
        width={132}
        height={34}
        className='block dark:hidden max-w-[136px] h-auto'
      />
      {/* White Logo (shown in dark mode) */}
      <img
        src={Logowhite}
        alt='Servora'
        width={132}
        height={34}
        className='hidden dark:block max-w-[136px] h-auto'
      />
    </Link>

  );
};

export default FullLogo;
