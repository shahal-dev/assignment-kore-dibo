export default function Stats() {
  // Stats data
  const stats = [
    {
      id: 1,
      value: "5,000+",
      label: "Completed Assignments"
    },
    {
      id: 2,
      value: "2,500+",
      label: "Happy Students"
    },
    {
      id: 3,
      value: "1,000+",
      label: "Expert Helpers"
    },
    {
      id: 4,
      value: "4.8/5",
      label: "Average Rating"
    }
  ];
  
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center p-6">
              <p className="text-4xl font-bold text-primary-600">{stat.value}</p>
              <p className="mt-2 text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
