import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Faq() {
  // FAQ data
  const faqs = [
    {
      id: 1,
      question: "How does Assignment Kore Dibo work?",
      answer: "Our platform connects students needing help with their assignments to qualified helpers who can assist them. Students post their assignments, helpers bid on them, and students select the helper they want to work with. After the work is completed and approved, payment is released to the helper."
    },
    {
      id: 2,
      question: "Is using Assignment Kore Dibo considered academic dishonesty?",
      answer: "Our platform is designed to provide educational assistance and learning resources. We encourage students to use our service for guidance, understanding concepts, and as a learning tool. The work provided should be used as a reference for your own original work and not submitted directly as your own."
    },
    {
      id: 3,
      question: "How much does it cost to use the platform?",
      answer: "Signing up and posting assignments is free for students. Students only pay the agreed-upon price for their assignments when they accept a helper's bid. For helpers, we charge a 15% commission on completed assignments. All prices are set in Bangladeshi Taka (BDT)."
    },
    {
      id: 4,
      question: "How are payments handled?",
      answer: "We support various payment methods including mobile banking services like bKash, Nagad, and Rocket, as well as bank transfers. Payments are held in escrow until the assignment is completed and approved by the student, ensuring security for both parties."
    },
    {
      id: 5,
      question: "What if I'm not satisfied with the work?",
      answer: "We have a revision policy where you can request changes if the work doesn't meet your requirements. If issues persist after revisions, our dispute resolution team will review the case and make a fair decision. We strive to ensure all students receive high-quality work."
    }
  ];
  
  // State to track which FAQ is open
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Toggle FAQ visibility
  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Assignment Kore Dibo
          </p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="border-b border-gray-200 pb-6 mb-6 last:mb-0 last:pb-0">
              <button 
                className="flex justify-between items-center w-full text-left focus:outline-none"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                <span className="ml-6 h-7 flex items-center">
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </span>
              </button>
              <div className={`mt-2 ${openFaq === index ? 'block' : 'hidden'}`}>
                <p className="text-base text-gray-600">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
