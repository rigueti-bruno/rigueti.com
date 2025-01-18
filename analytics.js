document.addEventListener("DOMContentLoaded", function () {
    // Função para carregar o script do Google Analytics
    function loadGoogleAnalytics() {
        var gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-GZSHCJH5WY";
        document.head.appendChild(gaScript);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-GZSHCJH5WY');
    }

    // Função para carregar o script do Microsoft Clarity
    function loadMicrosoftClarity() {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
            t = l.createElement(r);
            t.async = 1;
            t.src = "https://www.clarity.ms/tag/" + i + "?ref=bwt";
            y = l.getElementsByTagName(r)[0];
            y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "ol859pr0fo");
    }

    // Verificar se o consentimento já foi dado
    if (localStorage.getItem("cookiesAccepted") === "true") {
        loadGoogleAnalytics();
        loadMicrosoftClarity();
    }
});