import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
import logo from '@/public/Synergy-logo.png' 

export interface UserProps{
  width: number;
  height: number
}

export default function AcmeLogo({width, height}: UserProps) {
  return (
    <Image 
    src={logo}
    alt='CosmiMarket Main Icon'
    width={width}
    height={height}
/>
    // <div
    //   className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    // >
    //   <GlobeAltIcon className="h-12 w-12 rotate-[15deg]" />
    //   <p className="text-[44px]">Acme</p>
    // </div>
  );
}
