import { getPublicFooterContent, formatWhatsAppUrl } from "../data/public-cms";

export default async function WhatsAppFab() {
  const footer = await getPublicFooterContent();
  const waUrl = formatWhatsAppUrl(footer.whatsappUrl || footer.phone);

  return (
    <a
      className="whatsapp-fab"
      href={waUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Hubungi MBS Purworejo melalui WhatsApp"
    >
      <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.1Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.4 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4-.1.6.7 1.2 1.6 2.1 2.8 2.7.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .4-.2 1.3-.8 1.7-.6.5-1.4.7-2.3.5-1-.2-2.3-.7-3.9-2.1-1.9-1.7-3-3.8-3.2-4.7-.2-.9 0-1.5.3-1.9.4-.4.8-.6 1-.6Z"
          fill="currentColor"
        />
      </svg>
      <span className="whatsapp-label">Hubungi kami</span>
    </a>
  );
}
