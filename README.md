# Miacorp
Le fonctionnement commence par la configuration d’un compte service dans Google Cloud Console. Ce compte permet à l’application d’accéder aux documents Google Docs nécessaires pour générer les fichiers personnalisés. Une fois le compte service créé, son fichier de credentials est déposé dans le dossier credentials de l’application, ce qui permet l’authentification automatique. Dans l’espace administrateur, l’admin peut créer des templates correspondant à des types d’entreprises, par exemple une SARL. Chaque template peut contenir plusieurs documents, qui sont rédigés dans Google Docs. Dans ces documents, l’admin insère des variables dynamiques (selon une syntaxe spécifique qui est expliquée dans un document séparé). Il partage ensuite le document avec le compte service et insère le lien du document ainsi que son titre dans l’espace de création de template. L’admin peut répéter ce processus pour ajouter autant de documents que nécessaire dans une même template. Une fois la template complète, elle est envoyée à un expert juridique, qui peut la consulter dans son propre espace. L’expert peut soit valider la template, soit la rejeter avec un commentaire précisant la raison du rejet. Seules les templates validées deviennent visibles pour les clients. Lorsqu’un client souhaite créer une entreprise, il accède à son espace, choisit le type d’entreprise souhaité (ex. SARL), et l’application génère automatiquement un formulaire à remplir à partir des variables définies dans les documents de la template correspondante. Le client remplit les champs demandés, peut prévisualiser et modifier ses informations, puis téléverse une copie de sa pièce d’identité. Il envoie ensuite sa demande à l’expert juridique pour validation. L’expert consulte les informations, les valide ou les rejette avec un commentaire explicatif. Si le traitement tarde, le client peut utiliser une messagerie interne pour contacter directement l’expert, poser des questions ou transmettre des documents supplémentaires. Une fois la demande validée, l’application génère automatiquement tous les documents liés à l’entreprise du client, en insérant les données dans les modèles Google Docs, et les rend disponibles au téléchargement en formats PDF ou Word. Le backend de l’application est développé avec FastAPI pour gérer les routes, la logique métier et les connexions à la base de données, qui est CouchDB, un système NoSQL permettant de stocker des documents JSON de manière flexible. Le frontend est conçu en React pour offrir une interface utilisateur fluide et dynamique pour les trois rôles principaux : administrateur, expert juridique, et client.

# Voici un exemple d’un document (statuts d'une SARL) pour voir comment on écrit les variables, les boucles et les conditions.  :  

{{denomination_sociale}}

SOCIETE PAR ACTIONS SIMPLIFIEE
CAPITAL SOCIAL : {{capital_social}} Euros
Adresse du siège social : {{adresse_siege_social}}

STATUTS CONSTITUTIFS

ENTRE LES SOUSSIGNES

{{#LOOP_ACTIONNAIRES}}  
{{nom_associe}}, né le {{date_naissance_associe}} à {{lieu_naissance_associe}}, demeurant {{adresse_associe}} de nationalité {{nationalite_associe}}.
{{/LOOP_ACTIONNAIRES}}

IL A ETE ARRETE ET CONVENU CE QUI SUIT :

ARTICLE 1- FORME
Il est formé par les présentes, entre les propriétaires actuels ou futurs des actions ci-après créées, ou de celles qui pourront l'être par la suite, une société par actions simplifiée qui sera régie par les dispositions du Code de commerce et notamment les articles L. 227-1 et suivants.

ARTICLE 2 - OBJET
La société a pour objet, {{objet_social}}.

ARTICLE 3 – DENOMINATION
La dénomination est « {{denomination_sociale}} »
Dans tous les actes et documents émanant de la société et destinés aux tiers, notamment les lettres, factures, annonces et publications diverses, cette dénomination doit être précédée ou suivie immédiatement et lisiblement des mots «société par actions simplifiée au capital de {{capital_social}} € ou des initiales S.A.S. au capital de {{capital_social}} €. », du numéro d'immatriculation au registre du Commerce et des Sociétés ainsi que le montant de son capital statutaire.

ARTICLE 4 - SIEGE SOCIAL
Le siège social de la société est fixé à : {{adresse_siege_social}},
il pourra être transféré en tout autre lieu par décision du président ou par décision collective extraordinaire des associés.

ARTICLE 5 - DUREE
La durée de la société est fixée à {{duree_societe}} années qui commenceront à courir à compter de son immatriculation au registre de commerce et des sociétés, sauf le cas de dissolution anticipée ou de prorogation.

ARTICLE 6 - APPORTS

APPORTS EN NUMERAIRE : les soussignés suivants effectuent des apports en numéraire à savoir :

{{#LOOP_ACTIONNAIRES}}
{{nom_associe}} actionnaire porteur de la somme de {{apport_numeraire_associe}} €
{{/LOOP_ACTIONNAIRES}}

Total des apports en numéraire : {{total_apports_numeraire}} Euros
Soit au total la somme de {{total_apports_numeraire}} EUROS.

ARTICLE 7 - CAPITAL SOCIAL
Le capital social est fixé à la somme de {{capital_social}} Euros divisé en {{nombre_total_actions}} actions de {{valeur_nominale_action}} Euros chacune, entièrement libérées, numérotées de 1 à {{nombre_total_actions}}.

REPARTITION DES ACTIONS :
{{#LOOP_ACTIONNAIRES}}
{{nom_associe}} actionnaire porteur de {{nombre_actions_associe}} ACTIONS
{{/LOOP_ACTIONNAIRES}}

Total égal au capital social de {{nombre_total_actions}} Actions

ARTICLE 8 - CESSIONS D'ACTIONS
CESSION D'ACTIONS
Les cessions d'actions doivent être constatées par un acte de cession sous seing privé ou par acte notarié ; elles ne sont opposables à la société et aux tiers qu'après avoir été signifiées à la société ou acceptées par elle dans un acte authentique.
Les cessions d'actions à des tiers sont libres, sauf dispositions contraires des présents statuts. Entre actionnaires, les actions sont librement cessibles.

ARTICLE 9 - INDIVISIBILITE DES ACTIONS
Les actions sont indivisibles à l'égard de la société qui ne connaît qu'un seul propriétaire pour chacune d'elles.
Les copropriétaires indivis d'actions sont tenus de se faire représenter auprès de la société par une seule et même personne nommée d'accord entre eux ou à défaut, par le président du Tribunal de Commerce du lieu du siège social, à la requête de la partie la plus diligente.

ARTICLE 10 - DROITS ET OBLIGATIONS ATTACHES AUX ACTIONS
Chaque action donne droit à une fraction proportionnelle au nombre des actions existantes dans la propriété de l'actif social et dans le partage des bénéfices.

ARTICLE 11 - RESPONSABILITE DES ACTIONNAIRES
Les actionnaires ne sont responsables que jusqu'à concurrence du montant de leurs apports.

ARTICLE 12 - DIRECTION DE LA SOCIETE
La société est dirigée par un Président nommé par décision collective des actionnaires.

Le Président est :
{{#LOOP_PRESIDENTS}}
{{nom_associe}}, né le {{date_naissance_associe}} à {{lieu_naissance_associe}} demeurant {{adresse_associe}} de nationalité {{nationalite_associe}}
{{/LOOP_PRESIDENTS}}

Nommé pour une durée illimitée.
Le Président a les pouvoirs les plus étendus pour agir au nom de la société, dans toutes les circonstances et pour faire autoriser tous actes et opérations relatives à l'objet social. Le Président a la signature sociale.
Il peut se faire remplacer par un mandataire pour les opérations rentrant dans le cadre de celles-ci dessus prévues.

ARTICLE 13 - LIMITATION DES POUVOIRS DU PRESIDENT
Le Président ne contractera, en raison de sa gestion, aucune obligation personnelle ou solidaire relativement aux engagements de la Société. Il est responsable, soit envers la société, soit envers les tiers, des infractions aux dispositions du Code de commerce, des violations des présents statuts et des fautes par lui commises dans sa gestion.

ARTICLE 14 - REMUNERATION DU PRESIDENT
Le Président a droit, en rémunération de son travail, et en compensation de la responsabilité attachée à sa gestion, à un traitement qui sera fixé ultérieurement.
Le dit traitement sera payable à la fin de chaque mois, et porté aux frais généraux, indépendamment de ses frais de représentation, voyages et déplacements.

ARTICLE 15 - DECISIONS COLLECTIVES
Les actionnaires se réunissent en assemblée au moins une fois par an dans les six mois de la clôture de l'exercice social.
Les décisions collectives ordinaires sont prises à la majorité des voix des actionnaires présents ou représentés.
Les décisions collectives extraordinaires sont prises à la majorité des deux tiers des voix des actionnaires présents ou représentés.

ARTICLE 16 — EXERCICE SOCIAL
L'année sociale commence le premier janvier et finit le trente et un décembre.
Toutefois, l'exercice actuel comprendra la période comprise entre la date du début d'activité et le {{fin_exercice}}.

ARTICLE 17 — ETABLISSEMENT DES COMPTES SOCIAUX
Il doit être tenu des écritures des affaires sociales, suivant les lois et usages du commerce.
Il est établi à la fin de chaque exercice social, par les soins du Président, un inventaire général de l'actif et du passif de la société, le compte de résultat, le bilan et tous les états exigés par l'administration.

ARTICLE 18 — APPROBATION DES COMPTES ANNUELS ET AFFECTATION DES RESULTATS
Les produits de la Société, constatés par l'inventaire annuel, déduction faite des frais généraux et charges sociales, de tous amortissements de l'actif et de toutes provisions pour risques commerciaux ou industriels, constituent le bénéfice net.
Sur le bénéfice net, il est prélevé cinq pour cent pour la constitution du fonds de réserve légale ; ce prélèvement cesse d'être obligatoire dès que le fonds de réserve a atteint le dixième du capital social.
Le surplus des bénéfices nets est réparti aux actionnaires, proportionnellement au nombre des actions qu'ils possèdent.

ARTICLE 19 — DECES OU INCAPACITE D'UN ACTIONNAIRE
La société n'est pas dissoute par le décès, l'interdiction, la faillite ou la déconfiture d'un actionnaire. En cas de décès d'un actionnaire, la Société continuera entre les actionnaires survivants et les héritiers et représentants de l'actionnaire décédé.

ARTICLE 20 — CAPITAUX PROPRES INFERIEURS A LA MOITIE DU CAPITAL SOCIAL
En cas de pertes constatées dans les documents comptables, et si l'actif net de la société devient inférieur à la moitié du capital social, les actionnaires décident, dans les quatre mois qui suivent l'approbation des comptes ayant fait apparaître cette perte, s'il y a lieu à dissolution anticipée de la Société.

ARTICLE 21— TRANSFORMATION
La présente Société pourra être transformée en toute autre forme sociale dans les conditions prévues par la loi.

ARTICLE 22 — DISSOLUTION — LIQUIDATION
A l'expiration du terme fixé par les statuts ou en cas de dissolution anticipée de la Société, la liquidation sera faite par les soins du liquidateur nommé à cet effet par les actionnaires.
Le ou les liquidateurs auront les pouvoirs les plus étendus pour la réalisation de l'actif et le paiement du passif.

ARTICLE 23 — CONTESTATIONS
Toutes contestations qui pourraient s'élever pendant la durée de la société ou lors de sa liquidation, entre les actionnaires ou entre les actionnaires et la société, seront soumises à la juridiction des tribunaux compétents du siège social.

ARTICLE 24
Pour l'exécution des présentes, les soussignés font élection de domicile au siège de la Société, avec attribution de juridiction au Tribunal de Commerce dont relève la Société.

ARTICLE 25 — FRAIS
Les frais, droits et honoraires auxquels le présent acte donnera lieu seront à la charge de la Société.
Ils seront portés au compte des frais généraux et amortis dès le premier exercice.

Fait en six originaux dont un pour l'Enregistrement, deux pour les dépôts de Greffe, un pour rester déposé au Siège Social, conformément à la loi et deux pour être remis à chaque actionnaire.

Fait à {{lieu_signature}}, le {{date_signature}}

SIGNATURES
{{#LOOP_ACTIONNAIRES}}
{{nom_associe}}
Actionnaire{{#IF_PRESIDENT}} et pour acceptation des fonctions de Président{{/IF_PRESIDENT}}.

{{/LOOP_ACTIONNAIRES}}
