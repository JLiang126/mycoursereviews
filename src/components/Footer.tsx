'use client';

import { Divider, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
    FaDiscord,
    FaEnvelope,
    FaFacebook,
    FaGithub,
    FaInstagram,
    FaLinkedin,
    FaTiktok,
    FaYoutube,
} from 'react-icons/fa';

const SOCIAL_LINKS = [
    { icon: FaEnvelope, link: 'mailto:dev@csclub.org.au' },
    { icon: FaGithub, link: 'https://github.com/compsci-adl' },
    { icon: FaInstagram, link: 'https://www.instagram.com/csclub.adl/' },
    { icon: FaTiktok, link: 'https://www.tiktok.com/@csclub.adl/' },
    { icon: FaFacebook, link: 'https://www.facebook.com/compsci.adl/' },
    { icon: FaDiscord, link: 'https://discord.gg/UjvVxHA' },
    { icon: FaLinkedin, link: 'https://www.linkedin.com/company/compsci-adl/' },
    { icon: FaYoutube, link: 'https://www.youtube.com/@csclub-adl/' },
];

const FOOTER_SECTIONS = [
    {
        title: 'About',
        bgClass: 'bg-neonyellow text-mixtapeblack',
        content:
            "MyCourseReviews is the Adelaide University Computer Science Club's course outlines and review portal. Built by students, for students, it provides a transparent, secure platform that allows university peers to cast ratings easily on difficulty, usefulness, and enjoyment metrics, helping students explore their study pathways.",
    },
    {
        title: 'Disclaimer',
        bgClass: 'bg-neongreen text-mixtapeblack',
        content:
            "MyCourseReviews is a student-run repository developed by the Computer Science Club. The club is an independent student organization and does not officially represent the Adelaide University, Faculty, or School. Ratings and reviews express the subjective experiences of individual authors, and course information is subject to change.",
    },
    {
        title: 'Privacy',
        bgClass: 'bg-hotpink text-white',
        content:
            "MyCourseReviews secures all user logins through the CS Club authentication system. Although reviews can be published anonymously on the public frontend, user Keycloak sub identifiers are safely stored in our database for moderation, accountability, and anti-spam protection. We do not share or trade student identity details.",
    },
    {
        title: 'Terms',
        bgClass: 'bg-cyanaccent text-white',
        content:
            "By using MyCourseReviews, you agree to comply with our Code of Conduct: reviews must comply with the Adelaide University Student Charter, remaining respectful, fair, and constructive. We strictly prohibit fake content, spam, off-topic, offensive, or malicious submissions. Tutors and coordinators are barred from reviewing semesters in which they taught, and personal information or harassment is strictly forbidden.",
    },
];

interface FooterModalProps {
    title: string;
    content: string;
    isOpen: boolean;
    onClose: () => void;
}

const FooterModal = ({ title, content, isOpen, onClose }: FooterModalProps) => (
    <Modal isOpen={isOpen} onClose={onClose} className="bg-background border-4 border-foreground text-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <ModalContent className="rounded-none">
            <ModalHeader className="font-mixtape uppercase tracking-tighter text-xl border-b-3 border-foreground px-6 py-4">{title}</ModalHeader>
            <ModalBody className="p-6">
                <p className="text-sm font-mono leading-relaxed">{content}</p>
            </ModalBody>
        </ModalContent>
    </Modal>
);

export const Footer = () => {
    const [openModal, setOpenModal] = useState<string | null>(null);

    return (
        <footer className="w-full mt-12 bg-background border-4 border-foreground p-6 sm:p-8 rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] max-w-screen-xl mx-auto">
            <div className="grid grid-cols-2 items-center gap-6 mobile:grid-cols-1 mobile:justify-items-center mobile:gap-8">
                
                {/* Logo and Brand Title */}
                <div className="flex items-center gap-3">
                    <Image src="/favicon.png" alt="CS Club Logo" width={40} height={40} priority unoptimized className="hover:rotate-12 transition-transform duration-300 select-none" />
                    <h1 className="text-lg font-mixtape font-black tracking-tight text-foreground select-none">
                        MyCourseReviews
                    </h1>
                </div>

                {/* Course information tab sections */}
                <div className="mt-0 flex flex-wrap gap-4 justify-self-end mobile:justify-self-auto">
                    {FOOTER_SECTIONS.map((section, i) => (
                        <h3
                            key={i}
                            className={`cursor-pointer font-mono text-xs uppercase tracking-wide font-black border-2 border-foreground px-2 py-1 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:scale-105 active:scale-95 transition-all ${section.bgClass}`}
                            onClick={() => setOpenModal(section.title)}
                        >
                            {section.title}
                        </h3>
                    ))}
                </div>

                <div className="font-mono text-xs text-foreground/60 font-semibold">
                    <span className="mr-1">&copy; {new Date().getFullYear()}</span>
                    <a href="https://csclub.org.au/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
                        Adelaide University Computer Science Club
                    </a>
                </div>

                {/* Sticker-style social badges */}
                <div className="flex flex-wrap gap-3 justify-self-end text-sm mobile:justify-self-auto">
                    {SOCIAL_LINKS.map(({ icon: Icon, link }, i) => (
                        <a
                            href={link}
                            key={i}
                            className="p-1.5 border-2 border-foreground rounded-none bg-background text-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:bg-neongreen hover:text-mixtapeblack hover:rotate-6 hover:-translate-y-0.5 transition-all duration-150"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Icon />
                        </a>
                    ))}
                </div>
            </div>

            {FOOTER_SECTIONS.map((section) => (
                <FooterModal
                    key={section.title}
                    title={section.title}
                    content={section.content}
                    isOpen={openModal === section.title}
                    onClose={() => setOpenModal(null)}
                />
            ))}
        </footer>
    );
};
