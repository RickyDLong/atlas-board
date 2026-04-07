import Image from 'next/image';

interface AtlasLogoProps {
  size?: number;
  className?: string;
}

export function AtlasLogo({ size = 32, className = '' }: AtlasLogoProps) {
  return (
    <div
      className={`rounded-lg flex items-center justify-center bg-[#16161e] border border-[#2a2a3a]/60 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/axe-icon.svg"
        alt="Atlas"
        width={Math.round(size * 0.75)}
        height={Math.round(size * 0.75)}
        className="object-contain"
      />
    </div>
  );
}
