import React, { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Textarea, Select, SelectItem
} from "@heroui/react";

export default function RequestLeave({ isOpen, onClose, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    timeOffType: "Vacation Leave",
    beginDate: "",
    endDate: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  setLoading(true);
  const myToken = localStorage.getItem("access_token");

  // I-map ang frontend state sa backend schema
  const payload = {
    TimeOffType: formData.timeOffType,
    BeginDate: formData.beginDate,
    EndDate: formData.endDate,
    Description: formData.description
  };

  try {
    const response = await fetch("http://172.96.10.161:8000/RequestLeave", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${myToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      onSubmitSuccess(); 
      onClose(); 
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.detail || "Failed to submit request"}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="top-center" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">File Leave Request</ModalHeader>
        <ModalBody>
          <Select 
            label="Leave Type" 
            variant="bordered"
            selectedKeys={[formData.timeOffType]}
            onChange={(e) => setFormData({...formData, timeOffType: e.target.value})}
          >
            <SelectItem key="Vacation Leave" value="Vacation Leave">Vacation Leave</SelectItem>
            <SelectItem key="Sick Leave" value="Sick Leave">Sick Leave</SelectItem>
            <SelectItem key="Emergency Leave" value="Emergency Leave">Emergency Leave</SelectItem>
          </Select>
          
          <div className="flex gap-4">
            <Input
              label="Start Date"
              type="date"
              variant="bordered"
              onChange={(e) => setFormData({...formData, beginDate: e.target.value})}
            />
            <Input
              label="End Date"
              type="date"
              variant="bordered"
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
          </div>

          <Textarea
            label="Reason/Description"
            placeholder="Enter your reason here..."
            variant="bordered"
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button color="success" className="text-white" isLoading={loading} onPress={handleSubmit}>
            Submit Request
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}