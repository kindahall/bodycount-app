import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 prose prose-sm sm:prose lg:prose-lg xl:prose-xl">
      <h1>Politique de Confidentialité</h1>
      <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <h2>Introduction</h2>
      <p>
        Bienvenue sur Bodycount — Intelligent Relationship Journal (&quot;nous&quot;, &quot;notre&quot;, ou &quot;nos&quot;).
        Nous respectons votre vie privée et nous nous engageons à la protéger. Cette politique de confidentialité
        explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous
        utilisez notre application mobile/web (le &quot;Service&quot;).
      </p>
      <p>
        Veuillez lire attentivement cette politique de confidentialité. SI VOUS N&apos;ÊTES PAS D&apos;ACCORD AVEC LES TERMES
        DE CETTE POLITIQUE DE CONFIDENTIALITÉ, VEUILLEZ NE PAS ACCÉDER AU SERVICE.
      </p>

      <h2>Collecte de Vos Informations</h2>
      <p>
        Nous pouvons collecter des informations vous concernant de différentes manières. Les informations que nous
        pouvons collecter via le Service comprennent :
      </p>
      <h3>Données Personnelles</h3>
      <p>
        Des informations personnellement identifiables, telles que votre nom, votre adresse e-mail,
        que vous nous fournissez volontairement lorsque vous vous inscrivez au Service.
        Vous n&apos;êtes nullement obligé de nous fournir des informations personnelles de quelque nature que ce soit,
        cependant votre refus de le faire peut vous empêcher d&apos;utiliser certaines fonctionnalités du Service.
      </p>
      <h3>Données d&apos;Utilisation du Journal</h3>
      <p>
        Les informations que vous saisissez dans votre journal, y compris les détails sur les partenaires,
        les rencontres, les notes, les humeurs, les tags et tout autre contenu que vous choisissez de fournir.
        Ces données sont stockées de manière sécurisée et sont considérées comme hautement confidentielles.
      </p>
      <p>
        <strong>Nous nous engageons à ne jamais vendre, partager à des tiers à des fins de marketing,
        ou utiliser vos données de journal individuelles à d&apos;autres fins que celles de vous fournir
        et d&apos;améliorer les fonctionnalités du Service (par exemple, pour alimenter les analyses
        personnalisées de Holly, si vous activez cette fonctionnalité).</strong>
      </p>
      
      <h2>Utilisation de Vos Informations</h2>
      <p>
        Ayant des informations précises à votre sujet nous permet de vous fournir une expérience fluide,
        efficace et personnalisée. Plus précisément, nous pouvons utiliser les informations collectées
        vous concernant via le Service pour :
      </p>
      <ul>
        <li>Créer et gérer votre compte.</li>
        <li>Vous fournir les fonctionnalités de journalisation et d&apos;analyse.</li>
        <li>Générer des aperçus personnalisés (si la fonctionnalité Holly est activée).</li>
        <li>Vous envoyer un e-mail concernant votre compte ou votre commande.</li>
        <li>Améliorer l&apos;efficacité et le fonctionnement du Service.</li>
        <li>Surveiller et analyser l&apos;utilisation et les tendances pour améliorer votre expérience avec le Service.</li>
        <li>Vous informer des mises à jour du Service.</li>
        <li>Répondre aux demandes de produits et de service client.</li>
      </ul>

      <h2>Divulgation de Vos Informations</h2>
      <p>
        Nous pouvons partager les informations que nous avons collectées vous concernant dans certaines situations.
        Vos informations peuvent être divulguées comme suit :
      </p>
      <h3>Par la Loi ou pour Protéger les Droits</h3>
      <p>
        Si nous estimons que la divulgation d&apos;informations vous concernant est nécessaire pour répondre à une
        procédure judiciaire, pour enquêter ou remédier à des violations potentielles de nos politiques,
        ou pour protéger les droits, la propriété et la sécurité d&apos;autrui, nous pouvons partager vos
        informations comme permis ou requis par toute loi, règle ou réglementation applicable.
      </p>
      <h3>Fournisseurs de Services Tiers</h3>
      <p>
        Nous pouvons partager vos informations avec des tiers qui effectuent des services pour nous ou en notre nom,
        y compris l&apos;hébergement de données (par exemple, Supabase), l&apos;analyse de données, et le service client.
        Ces fournisseurs de services tiers auront accès à vos informations personnelles uniquement pour effectuer
        ces tâches en notre nom et sont obligés de ne pas les divulguer ou les utiliser à d&apos;autres fins.
      </p>

      <h2>Sécurité de Vos Informations</h2>
      <p>
        Nous utilisons des mesures de sécurité administratives, techniques et physiques pour aider à protéger
        vos informations personnelles. Bien que nous ayons pris des mesures raisonnables pour sécuriser les
        informations personnelles que vous nous fournissez, veuillez être conscient que malgré nos efforts,
        aucune mesure de sécurité n&apos;est parfaite ou impénétrable, et aucune méthode de transmission de données
        ne peut être garantie contre toute interception ou autre type d&apos;utilisation abusive.
      </p>

      <h2>Politique Concernant les Enfants</h2>
      <p>
        Nous ne sollicitons pas sciemment des informations auprès des enfants de moins de 13 ans et ne commercialisons
        pas sciemment auprès d&apos;eux. Si nous apprenons que nous avons collecté des informations personnelles
        d&apos;un enfant de moins de 13 ans sans vérification du consentement parental, nous supprimerons ces
        informations aussi rapidement que possible.
      </p>

      <h2>Options Concernant Vos Informations</h2>
      <h3>Informations du Compte</h3>
      <p>
        Vous pouvez à tout moment revoir ou modifier les informations de votre compte ou résilier votre compte en :
      </p>
      <ul>
        <li>Vous connectant aux paramètres de votre compte et mettant à jour votre compte.</li>
        <li>Nous contactant en utilisant les informations de contact fournies ci-dessous.</li>
      </ul>
      <p>
        Sur votre demande de résiliation de votre compte, nous désactiverons ou supprimerons votre compte et
        vos informations de nos bases de données actives. Cependant, certaines informations peuvent être
        conservées dans nos fichiers pour prévenir la fraude, dépanner des problèmes, aider à toute enquête,
        faire respecter nos Conditions d&apos;Utilisation et/ou se conformer aux exigences légales.
      </p>

      <h2>Contactez-Nous</h2>
      <p>
        Si vous avez des questions ou des commentaires concernant cette Politique de Confidentialité,
        veuillez nous contacter à : [Adresse e-mail de contact à ajouter]
      </p>
    </div>
  );
};

export default PrivacyPolicyPage;
