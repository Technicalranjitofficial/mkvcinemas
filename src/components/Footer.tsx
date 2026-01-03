export default function Footer() {
    return (
        <footer className="bg-neutral-950 border-t border-neutral-900 py-8 mt-12">
            <div className="container mx-auto px-4 text-center text-neutral-500 text-sm">
                <p>&copy; {new Date().getFullYear()} MKVCinemas. All rights reserved.</p>
                <div className="mt-4 space-x-4">
                    <a href="#" className="hover:text-neutral-300">Disclaimer</a>
                    <a href="#" className="hover:text-neutral-300">Privacy Policy</a>
                    <a href="#" className="hover:text-neutral-300">Contact Us</a>
                </div>
                <p className="mt-4 text-xs text-neutral-600">
                    We do not host any files on our servers. All files are hosted on third-party services.
                </p>
            </div>
        </footer>
    );
}
