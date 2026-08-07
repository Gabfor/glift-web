import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BackLinkProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export default function BackLink({ children, href, onClick, className = '' }: BackLinkProps) {
    const content = (
        <>
            <div className="relative w-2 h-3 mr-2 flex-shrink-0">
                <Image
                    src="/icons/chevron_left.svg"
                    alt="Retour"
                    fill
                    className="object-contain transition-opacity duration-150 group-hover:opacity-0"
                />
                <Image
                    src="/icons/chevron_left_hover.svg"
                    alt="Retour (hover)"
                    fill
                    className="object-contain opacity-0 transition-opacity duration-150 group-hover:opacity-100 absolute top-0 left-0"
                />
            </div>
            {children}
        </>
    );

    const baseClasses = `flex items-center text-sm text-[#5D6494] hover:text-[#3A416F] text-[15px] font-semibold cursor-pointer group w-fit transition-colors ${className}`;

    if (href) {
        return (
            <Link href={href} className={baseClasses} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <div className={baseClasses} onClick={onClick}>
            {content}
        </div>
    );
}
