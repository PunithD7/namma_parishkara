import city1 from "@/assets/city-1.jpg";
import city2 from "@/assets/city-2.jpg";
import city3 from "@/assets/city-3.jpg";
import city4 from "@/assets/city-4.jpg";
import city5 from "@/assets/city-5.jpg";
import city6 from "@/assets/city-6.jpg";

const images = [city1, city2, city3, city4, city5, city6];
const doubled = [...images, ...images];

const MarqueeImages = () => (
  <section className="py-10 border-y border-border/50 bg-card overflow-hidden">
    <div className="flex gap-6 animate-marquee w-max">
      {doubled.map((src, i) => (
        <div
          key={i}
          className="w-72 h-48 rounded-2xl overflow-hidden flex-shrink-0 border border-border/50"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}
        >
          <img
            src={src}
            alt="City Infrastructure"
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  </section>
);

export default MarqueeImages;
