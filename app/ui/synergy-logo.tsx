import Image from 'next/image';
import logo from '@/public/Synergy-logo2.png' 

export interface UserProps{
  size: number;
}

export default function AcmeLogo({size}: UserProps) {
  return (
    <Image 
    src={logo}
    alt='Synergy Logo'
    width={size}
    height={size/4}
/>
  );
}
