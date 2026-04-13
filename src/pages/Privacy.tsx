import { motion } from 'motion/react';

export function Privacy() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/50 mb-8">Last updated: April 13, 2026</p>

          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">When you use JustStream, we collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> When you sign in with Google, we collect your email address, display name, and profile picture.</li>
                <li><strong>Usage Data:</strong> We collect information about your interactions with the Platform, including your watch history, search queries, and preferences.</li>
                <li><strong>Device Information:</strong> We may collect information about the device and browser you use to access the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-2">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services.</li>
                <li>Personalize your experience and provide tailored content recommendations based on your watch history.</li>
                <li>Communicate with you about updates, security alerts, and administrative messages.</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
              <p>We do not sell your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>With your consent or at your direction.</li>
                <li>To comply with legal obligations or respond to lawful requests from authorities.</li>
                <li>To protect the rights, property, or safety of JustStream, our users, or the public.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights and Choices</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your account information via the Settings menu.</li>
                <li>Clear your watch history at any time from the Privacy & Safety settings.</li>
                <li>Delete your account entirely, which will remove your personal data from our active databases.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
              <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact our support team through the Help & Support section in your account settings.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
