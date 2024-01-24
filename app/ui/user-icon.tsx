import Image from 'next/image';

export interface UserProps{
  size: number;
  alt: string;
  src: string;
}

export default function UserIcon({size, alt, src}: UserProps) {
  return (
    <Image 
    src={src}
    alt={alt}
    width={size}
    height={size}
    className="mr-4 rounded-full"
/>
  );
}
