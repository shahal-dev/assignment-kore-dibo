import { StarRating } from "@/components/ui/star-rating";

export default function Testimonials() {
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      rating: 5,
      text: "Assignment Kore Dibo saved my semester! I was struggling with multiple assignments, and the helper I found was knowledgeable and delivered quality work before the deadline.",
      name: "Rahim Hossain",
      position: "Student, Dhaka University",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=60&h=60&q=80"
    },
    {
      id: 2,
      rating: 5,
      text: "As a helper on this platform, I've been able to use my knowledge to help students while earning a decent income. The bidding system is fair, and I can choose assignments I'm good at.",
      name: "Nusrat Jahan",
      position: "Academic Writer, BUET Graduate",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=60&h=60&q=80"
    },
    {
      id: 3,
      rating: 4.5,
      text: "The platform is easy to use and finding the right helper for my programming assignment was quick. Communication was smooth, and I learned a lot from the detailed explanations provided.",
      name: "Tanvir Rahman",
      position: "Student, North South University",
      avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&auto=format&fit=crop&w=60&h=60&q=80"
    }
  ];
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from students and helpers who have used our platform
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex mb-4">
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="text-gray-600 italic">
                "{testimonial.text}"
              </p>
              <div className="mt-6 flex items-center">
                <img 
                  src={testimonial.avatar} 
                  alt={`${testimonial.name} testimonial`} 
                  className="w-10 h-10 rounded-full object-cover" 
                />
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500">{testimonial.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
