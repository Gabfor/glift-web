import React from "react";

export default function PaymentFormSkeleton() {
    return (
        <div className="w-full animate-pulse">
            {/* Express Checkout buttons skeleton */}
            <div className="w-full max-w-[368px] mx-auto mb-[25px] flex flex-col gap-[20px]">
                <div className="h-[44px] w-full rounded-full bg-[#E6E8F5]" />
                <div className="h-[44px] w-full rounded-full bg-[#E6E8F5]" />
            </div>

            {/* Separator skeleton */}
            <div className="relative my-[25px] flex items-center justify-center w-full max-w-[368px] mx-auto">
                <div className="w-full border-t border-[#ECE9F1]" />
            </div>

            <div className="w-full max-w-[368px] mx-auto mb-[30px]">
                {/* Numéro de carte */}
                <div className="mb-5">
                    <div className="h-[20px] w-[140px] bg-[#E6E8F5] rounded-[4px] mb-[8px]" />
                    <div className="h-[45px] w-full rounded-[5px] bg-[#F2F1F6] border border-[#ECE9F1]" />
                </div>

                {/* Date d'expiration */}
                <div className="mb-5">
                    <div className="h-[20px] w-[130px] bg-[#E6E8F5] rounded-[4px] mb-[8px]" />
                    <div className="h-[45px] w-full rounded-[5px] bg-[#F2F1F6] border border-[#ECE9F1]" />
                </div>

                {/* Code de sécurité */}
                <div className="w-[179px] mb-6">
                    <div className="h-[20px] w-[120px] bg-[#E6E8F5] rounded-[4px] mb-[8px]" />
                    <div className="h-[45px] w-full rounded-[5px] bg-[#F2F1F6] border border-[#ECE9F1]" />
                </div>
            </div>

            {/* Checkbox line */}
            <div className="flex items-start gap-3 mb-5 w-full max-w-[564px] mx-auto">
                <div className="w-[15px] h-[15px] rounded-[3px] bg-[#E6E8F5] shrink-0 mt-[3px]" />
                <div className="space-y-2 flex-1">
                    <div className="h-[12px] w-full bg-[#E6E8F5] rounded-[4px]" />
                    <div className="h-[12px] w-3/4 bg-[#E6E8F5] rounded-[4px]" />
                </div>
            </div>

            {/* Submit button */}
            <div className="mt-0 flex justify-center w-full">
                <div className="h-[48px] w-full sm:w-[220px] rounded-full bg-[#E6E8F5]" />
            </div>

            {/* Stripe footer */}
            <div className="mt-5 flex items-center justify-center gap-2">
                <div className="h-[14px] w-[180px] bg-[#E6E8F5] rounded-[4px]" />
            </div>
        </div>
    );
}
