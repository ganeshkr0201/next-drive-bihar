const TermsOfService = () => {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> January 2024
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using NextDrive Bihar's services, you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                NextDrive Bihar provides car rental and tour package services in Bihar, India. Our services include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Car rental services for various vehicle types</li>
                <li>Curated tour packages across Bihar</li>
                <li>Travel planning and booking assistance</li>
                <li>Customer support services</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Booking and Payment</h2>
              <p className="text-gray-700 mb-4">
                When you make a booking through our platform:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>All bookings are subject to availability</li>
                <li>Payment must be made as per the agreed terms</li>
                <li>Cancellation policies apply as specified at the time of booking</li>
                <li>Additional charges may apply for extra services or damages</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">
                As a user of our services, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Use vehicles and services responsibly</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Return vehicles in the same condition as received</li>
                <li>Report any incidents or damages immediately</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                NextDrive Bihar shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                or other intangible losses.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Cancellation Policy</h2>
              <p className="text-gray-700 mb-4">
                Cancellation terms vary by service type:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Car rentals: 24-hour notice required for full refund</li>
                <li>Tour packages: Cancellation fees may apply based on timing</li>
                <li>Emergency cancellations will be handled case-by-case</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Modifications to Terms</h2>
              <p className="text-gray-700 mb-4">
                NextDrive Bihar reserves the right to modify these terms at any time. Users will be 
                notified of significant changes via email or through our platform.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@nextdrivebihar.com<br />
                  <strong>Phone:</strong> +91 98765 43210<br />
                  <strong>Address:</strong> 123 Gandhi Maidan, Patna, Bihar 800001, India
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;