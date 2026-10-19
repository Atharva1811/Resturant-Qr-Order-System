import { Outlet } from "react-router";
import ScrollToTop from "src/components/shared/ScrollToTop";
import TestModeBanner from "src/components/shared/TestModeBanner";

const BlankLayout = () => (
  <>
    <TestModeBanner />
    <ScrollToTop>
      <Outlet />
    </ScrollToTop>
  </>
);

export default BlankLayout;
