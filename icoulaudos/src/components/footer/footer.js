export function createFooter() {
    // Cria o elemento footer
    const footer = document.createElement("footer");
    footer.className = "footer-container";
    footer.innerHTML = `
        <div id="footer-group">
            <p>
                <a href="#" class="footer-link">Termos de Uso</a> |
                <a href="#" class="footer-link">Política de Privacidade</a>
            </p>
            <p>Copyright &copy; 2025 iCoutech. All rights reserved.</p>
        </div>
    `;
    document.body.appendChild(footer);

    // Adiciona o CSS se ainda não estiver presente
    if (!document.getElementById("footer-css")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/src/components/footer/footer.css";
        link.id = "footer-css";
        document.head.appendChild(link);
    };
};