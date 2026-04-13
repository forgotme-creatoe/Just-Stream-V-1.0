import { motion } from 'motion/react';

export function Terms() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-white/50 mb-8">Last updated: April 13, 2026</p>

          <div className="space-y-8 text-white/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using JustStream ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts</h2>
              <p className="mb-4">To access certain features of the Platform, you must register for an account using your Google account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p>You must be at least 13 years old to use the Platform. If you are under 18, you must have your parent or guardian's permission.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Content and Intellectual Property</h2>
              <p className="mb-4"><strong>User Content:</strong> Approved creators retain all ownership rights to the content they upload. By uploading content, you grant JustStream a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, and display the content in connection with the service.</p>
              <p><strong>Platform Content:</strong> All other text, graphics, user interfaces, visual interfaces, photographs, trademarks, logos, sounds, music, artwork, and computer code on the Platform are owned, controlled, or licensed by or to JustStream.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Prohibited Conduct</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload or share content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
                <li>Violate any intellectual property rights or other proprietary rights of any party.</li>
                <li>Attempt to interfere with or disrupt the Platform's servers or networks.</li>
                <li>Use automated scripts or bots to collect information or interact with the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Termination</h2>
              <p>We reserve the right to suspend or terminate your account and access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
              <p>JustStream and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Platform.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
