import {
  Modal,
  ModalTrigger,
  ModalContent,
  // ... import other components as needed
} from '@components/ui/modal';

// Basic usage
function MyComponent() {
  return (
    <Modal>
      <ModalTrigger>Open Modal</ModalTrigger>
      <ModalContent>{/* Your modal content here */}</ModalContent>
    </Modal>
  );
}

// Controlled usage with state
function ControlledModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      {/* Modal content */}
    </Modal>
  );
}

/* ------------- Another usage of the modal ------------- */
('use client');

import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@components/ui/modal';

export default function ExamplePage() {
  return (
    <Modal>
      <ModalTrigger asChild>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Open Modal</button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Welcome</ModalTitle>
          <ModalDescription>This modal works with your Next.js setup</ModalDescription>
        </ModalHeader>
        <div className="py-4">
          <p>Your content here</p>
        </div>
        <ModalFooter>
          <button className="px-4 py-2 bg-gray-200 rounded-lg mr-2">Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
