document.addEventListener("DOMContentLoaded", function () {
    function loadGoogleAnalytics() {
        var gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-GZSHCJH5WY";
        gaScript.onload = function () {
            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-GZSHCJH5WY');
        };
        document.head.appendChild(gaScript);
    }

    function loadMicrosoftClarity() {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "pwi0ctbhqd");
    }

    function loadAnalytics() {
        loadGoogleAnalytics();
        loadMicrosoftClarity();
    }

    var banner = document.getElementById('cookie-banner');
    var accepted = localStorage.getItem("cookiesAccepted");

    if (accepted === "true") {
        loadAnalytics();
    } else if (accepted === null) {
        banner.style.display = 'block';

        document.getElementById('accept-cookies').addEventListener('click', function () {
            localStorage.setItem("cookiesAccepted", "true");
            banner.style.display = 'none';
            loadAnalytics();
        });

        document.getElementById('reject-cookies').addEventListener('click', function () {
            localStorage.setItem("cookiesAccepted", "false");
            banner.style.display = 'none';
        });
    }
});
