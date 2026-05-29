export const metadata = {
  title: "SAP Concur Ticket Validator",
  description: "Validate your support ticket before submission",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
