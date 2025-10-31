import Image from 'next/image';

export default function CyclonaLogo({ className = "w-32 h-32" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <Image 
        src="/Cyclona_Logo.png" 
        alt="Cyclona Logo" 
        width={160}
        height={160}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
