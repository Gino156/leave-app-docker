import React from "react";
import { Card, CardBody, Accordion, AccordionItem } from "@heroui/react";

const InformationPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-black mb-6 text-slate-800 uppercase tracking-tight">System Information</h1>
      <Accordion variant="splitted">
        <AccordionItem key="1" title="How to File Leave" className="font-bold">
          <p className="font-normal text-slate-600 pb-4">
            Simply click the "Request Leave" button on the dashboard and fill out the required dates and reason.
          </p>
        </AccordionItem>
        <AccordionItem key="2" title="Leave Credits" className="font-bold">
          <p className="font-normal text-slate-600 pb-4">
            Leave credits are refreshed every fiscal year. Contact HR for manual adjustments.
          </p>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default InformationPage;