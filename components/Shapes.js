// The brand's two crisp shapes, hot pink and chartreuse, merged like a poster.
// Used sparingly: behind the product glass on the landing page and in the closing band.
export default function Shapes({ className = 'shapes' }) {
  return (
    <svg className={className} viewBox="0 0 1200 520" aria-hidden="true" focusable="false">
      <path fill="#FF2DA8" d="M40 300 C120 180 300 220 380 140 C460 60 600 40 660 130 C720 220 640 300 700 380 C760 460 600 540 480 500 C360 460 300 520 180 500 C60 480 -20 400 40 300Z" />
      <path fill="#D4FF3F" d="M560 210 C640 110 820 60 940 120 C1060 180 1180 150 1180 270 C1180 390 1040 380 980 450 C920 520 760 520 700 440 C640 360 480 310 560 210Z" />
    </svg>
  )
}
