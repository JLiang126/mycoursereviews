'use client';

import { Divider, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
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
        content:
            "MyCourseReviews is the Adelaide University Computer Science Club's course outlines and review portal. Built by students, for students, it provides a transparent, secure platform that allows university peers to cast ratings easily on difficulty, usefulness, and enjoyment metrics, helping students explore their study pathways.",
    },
    {
        title: 'Disclaimer',
        content:
            "MyCourseReviews is a student-run repository developed by the Computer Science Club. The club is an independent student organization and does not officially represent the Adelaide University, Faculty, or School. Ratings and reviews express the subjective experiences of individual authors, and course information is subject to change.",
    },
    {
        title: 'Privacy',
        content:
            "MyCourseReviews secures all user logins through the CS Club authentication system. Although reviews can be published anonymously on the public frontend, user Keycloak sub identifiers are safely stored in our database for moderation, accountability, and anti-spam protection. We do not share or trade student identity details.",
    },
];

interface FooterModalProps {
    title: string;
    content: string;
    isOpen: boolean;
    onClose: () => void;
}

const FooterModal = ({ title, content, isOpen, onClose }: FooterModalProps) => (
    <Modal isOpen={isOpen} onClose={onClose} className="bg-background border border-divider text-foreground">
        <ModalContent>
            <ModalHeader className="font-extrabold">{title}</ModalHeader>
            <ModalBody>
                <p className="mb-4 text-sm text-foreground/80 leading-relaxed">{content}</p>
            </ModalBody>
        </ModalContent>
    </Modal>
);

export const Footer = () => {
    const [openModal, setOpenModal] = useState<string | null>(null);

    return (
        <footer className="space-y-4 text-foreground/50 py-8 max-w-screen-xl mx-auto w-full px-4">
            <Divider className="mb-6 bg-divider" />
            <div className="grid grid-cols-2 items-center gap-4 mobile:grid-cols-1 mobile:justify-items-center mobile:gap-6">
                
                <div className="flex items-center gap-2">
                    <img src="/favicon.ico" alt="Logo" className="w-12 h-12 p-1" />
                    <h1 className="ml-1 text-lg font-extrabold text-foreground">
                        MyCourseReviews
                    </h1>
                </div>

                <div className="mt-0 flex gap-6 justify-self-end mobile:justify-self-auto">
                    {FOOTER_SECTIONS.map((section, i) => (
                        <h3
                            key={i}
                            className="cursor-pointer text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors duration-200"
                            onClick={() => setOpenModal(section.title)}
                        >
                            {section.title}
                        </h3>
                    ))}
                    <Link
                        href="/terms"
                        className="text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors duration-200"
                    >
                        Terms &amp; Conditions
                    </Link>
                </div>

                <div className="flex items-center text-xs font-semibold">
                    <span className="mr-1">&copy; {new Date().getFullYear()}</span>
                    <a href="https://csclub.org.au/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
                        The Adelaide University Computer Science Club
                    </a>
                </div>

                <div className="flex gap-5 justify-self-end text-xl mobile:justify-self-auto">
                    {SOCIAL_LINKS.map(({ icon: Icon, link }, i) => (
                        <a
                            href={link}
                            key={i}
                            className="text-foreground/40 hover:text-primary transition-colors duration-200"
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
