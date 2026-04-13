import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const faqs = [
  {
    question: "What is JustStream?",
    answer: "JustStream is a premium streaming platform offering a wide variety of original content, movies, series, and shorts. Our mission is to provide high-quality entertainment accessible anywhere."
  },
  {
    question: "How do I upload a video?",
    answer: "Currently, video uploading is restricted to approved creators and administrators to maintain content quality and safety. If you are interested in becoming a creator, please contact our support team."
  },
  {
    question: "Is JustStream free to use?",
    answer: "Yes, creating an account and accessing our basic library of content is completely free. We may introduce premium features in the future."
  },
  {
    question: "How do I delete my account?",
    answer: "You can delete your account at any time by navigating to Settings > Account, and clicking the 'Delete Account' button in the Danger Zone section. Please note that this action is irreversible."
  },
  {
    question: "How do I clear my watch history?",
    answer: "To clear your watch history, go to Settings > Privacy & Safety, and click on 'Clear Watch History'. This will reset your recommendations."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-white/60 text-lg">Find answers to common questions about JustStream.</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-lg">{faq.question}</span>
                <ChevronDown className={cn("w-5 h-5 text-white/50 transition-transform", openIndex === index && "rotate-180")} />
              </button>
              <div 
                className={cn(
                  "px-6 overflow-hidden transition-all duration-300 ease-in-out",
                  openIndex === index ? "max-h-48 pb-4 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="text-white/60 leading-relaxed pt-2">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
