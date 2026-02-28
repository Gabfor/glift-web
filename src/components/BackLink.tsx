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
            <Image
                src="/icons/chevron_left.svg"
                alt="Retour"
                width={12}
                height={12}
                className="h-3 w-2 mr-2 group-hover:hidden"
            />
            <Image
                src="/icons/chevron_left_hover.svg"
                alt="Retour (hover)"
                width={12}
                height={12}
                className="h-3 w-2 mr-2 hidden group-hover:inline"
            />
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
