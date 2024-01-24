import Image from 'next/image';
import icon from '@/public/Synergy.png' 

export interface UserProps{
  size: number;
}

export default function AcmeLogo({size}: UserProps) {
  return (
    <Image 
    src={icon}
    alt='Synergy Logo'
    width={size}
    height={size}
/>
  );
}
