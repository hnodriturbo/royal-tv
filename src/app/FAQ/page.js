'use client';

import { useState, useRef, useEffect } from 'react';

const AccordionItem = ({ index, isOpen, toggle, question, answer }) => {
  // Manipulate the DOM with ref
  const contentRef = useRef(null);

  // Animate max-height based on content size
  const [height, setHeigt] = useState(0);
  useEffect(() => {
    if (isOpen) {
      setHeigt(contentRef.current.scrollHeight);
    } else {
      setHeigt(0);
    }
  }, [isOpen]);

  // Return html
  return (
    <div className="border-b border-gray-300">
      <button
        onClick={() => toggle(index)}
        className="w-full text-left flex justify-between items-center py-4"
      >
        <span className="text-lg font-semibold">{question}</span>
        <span className="text-xl">{isOpen ? '-' : '+'}</span>
      </button>

      <div
        ref={contentRef}
        style={{ maxHeight: `${height}px` }}
        className="overflow-hidden transition-all duration-500"
      >
        <p className="text-gray-300 pb-4">{answer}</p>
      </div>
    </div>
  );
};
// Tailwind Accordion questions
const TailwindAccordion = () => {
  const [activeIndex, setActiveIndex] = useState(null); // Track which one is open

  const toggleFAQ = (index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="container-style lg:w-8/12 w-11/12 mx-auto p-6 mt-20">
      <h2 className="text-3xl font-bold mb-6 text-center">FAQ ❓❓❓</h2>
      <div className="flex flex-col items-center">
        <hr className="border border-gray-400 w-8/12 text-center items-center justify-center mb-4" />
      </div>

      {/* ✅ Accordion Items */}
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          index={index}
          isOpen={activeIndex === index}
          toggle={toggleFAQ}
          question={faq.question}
          answer={faq.answer}
        />
      ))}
    </div>
  );
};

export default TailwindAccordion;

const faqs = [
  {
    question: 'What is IPTV and how do I use it?',
    answer:
      'IPTV is a service that allows you to stream live TV through apps installed on your device. It’s supported on most modern devices including smart TVs, phones, and computers.'
  },
  {
    question: 'How do I get started?',
    answer:
      'It’s super easy! Just reach out to us and we’ll guide you through everything — including a free trial setup.'
  },
  {
    question: 'Are the Icelandic channels available?',
    answer:
      'Yes, all channels from Iceland are available. Even the sport channels so you can watch all sport channels as you wish anytime.'
  },
  {
    question: 'Can I get a free trial?',
    answer:
      'Yes, we offer free trials in most cases. Availability may vary depending on server capacity.'
  },
  {
    question: 'How many people can watch at the same time?',
    answer:
      'This depends on your subscription plan, but typically one device is allowed per account unless multi-stream is enabled.'
  },
  {
    question: 'What do I need to start watching?',
    answer:
      'All you need is a stable internet connection and a compatible device. We’ll help you set up the rest.'
  },
  {
    question: 'Do I need special equipment?',
    answer:
      'No special equipment is required. Any device that supports IPTV apps — like Smart TVs, Android boxes, or phones — will work.'
  },
  {
    question: 'Does Royal TV work everywhere?',
    answer:
      'Yes, you can use the service anywhere in the world as long as you have internet access.'
  },
  {
    question: 'What happens if a channel doesn’t work?',
    answer:
      'We monitor and update our streams constantly. If you notice an issue, contact support and we’ll look into it right away.'
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Due to the nature of digital services, we don’t offer refunds. We always recommend starting with a free trial first.'
  },
  {
    question: 'How do I renew my subscription?',
    answer:
      'Renewing is easy — just visit our website or contact support and we’ll assist you with the process.'
  },
  {
    question: 'Can I use the same account on multiple devices?',
    answer:
      'Accounts are usually limited to one device unless your plan includes multi-device access. Contact us to upgrade.'
  },
  {
    question: 'Is the service stable and reliable?',
    answer:
      'Yes! We focus on delivering a smooth and reliable experience with minimal buffering and downtime.'
  },
  {
    question: 'How many channels are available?',
    answer:
      'Approximately 12-14.000 channels available from all countries. Even channels that need normally to pay for.'
  },
  {
    question: 'Can I use it on Apple TV or Android TV?',
    answer:
      'Absolutely! Royal TV supports most major platforms including Apple TV, Android TV, Fire Stick, and more.'
  },
  {
    question: 'Do you have customer support?',
    answer:
      'Yes, our support team is available via live chat, email, and other platforms to help you anytime you need.'
  },
  {
    question: 'Is there a long-term commitment?',
    answer:
      'Lowest purchase is for 6 months and longest for 1 year. For payment for either you will get the services for only a one time fee.'
  },
  {
    question: 'What kind of content do you offer?',
    answer:
      'Royal TV includes live TV channels, movies, series, sports, and more — all in one place.'
  },
  {
    question: 'Can I watch in HD or 4K?',
    answer:
      'Yes, many of our channels and content support HD and even 4K streaming for the best quality.'
  },
  {
    question: 'Will it work on slow internet?',
    answer:
      'We recommend at least a 10 Mbps connection for the best experience, but adaptive quality helps lower connections too.'
  },
  {
    question: 'Is it legal to use IPTV?',
    answer:
      'We only provide services in compliance with applicable laws. Please ensure you use IPTV services legally in your region.'
  }
];
