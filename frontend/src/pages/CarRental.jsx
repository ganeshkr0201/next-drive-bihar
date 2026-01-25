const CarRental = () => {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Car Rental Services</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-lg text-gray-600 mb-6">
            Explore our premium car rental services with a wide range of vehicles to suit your needs.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Economy Cars</h3>
              <p className="text-gray-600">Affordable and fuel-efficient vehicles for city travel.</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Luxury Cars</h3>
              <p className="text-gray-600">Premium vehicles for special occasions and comfort.</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">SUVs</h3>
              <p className="text-gray-600">Spacious vehicles perfect for family trips and adventures.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarRental;