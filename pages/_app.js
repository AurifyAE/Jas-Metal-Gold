import "@/styles/globals.css";
import "@/styles/common.scss";

import Layout from "@/components/Layout";
import { useEffect } from "react";
// https://api.vercel.com/v1/integrations/deploy/prj_AMvtut8nMRkLFfOnbbHy4pJoPExl/5Ae85Cr6nm

export default function App({ Component, pageProps, props }) {
 
  return (
    <Layout props={props}>
      <Component {...pageProps} />
    </Layout>
  );
}
