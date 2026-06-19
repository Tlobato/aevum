"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function TermosPage() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isEn = i18n.language?.startsWith("en");

    return (
        <main className="min-h-screen bg-black text-neutral-300 relative overflow-hidden flex flex-col items-center">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

            {/* Header / Navbar */}
            <header className="w-full border-b border-white/5 px-6 lg:px-12 py-6 z-20 bg-black/60 backdrop-blur-md sticky top-0">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button 
                        onClick={() => {
                            if (typeof window !== "undefined" && window.history.length <= 1) {
                                router.push("/dashboard");
                            } else {
                                router.back();
                            }
                        }} 
                        className="flex items-center gap-2 text-neutral-500 hover:text-amber-500 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t("vault.back", "Voltar")}
                    </button>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <span className="font-serif text-xl font-light tracking-tight text-white flex items-center gap-2">
                            <img src="/logo-relic.png" alt="Aevum" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            Aevum
                        </span>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <article className="w-full max-w-3xl px-6 py-12 z-10 select-none">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    {/* Page Header */}
                    <div className="border-b border-white/10 pb-8 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-amber-500" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif text-white font-light tracking-tight leading-tight">
                            {isEn 
                                ? "Terms of Use & Digital Custody" 
                                : "Termos de Uso e Política de Custódia Digital"}
                        </h1>
                        <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                            {isEn 
                                ? "Last updated: June 2026" 
                                : "Última atualização: Junho de 2026"}
                        </p>
                    </div>

                    {/* Terms Body */}
                    {isEn ? (
                        <div className="space-y-6 text-sm leading-relaxed font-light text-neutral-400">
                            <p>
                                Welcome to Aevum (available via <a href="https://myaevum.space" className="text-amber-500 hover:underline">https://myaevum.space</a>). This document is a legal agreement ("Agreement") between you ("User") and the Founders and Administrators of the Aevum Platform ("Aevum"), which regulates the use of our digital data sealing, storage, and scheduled delivery service ("Time Capsules").
                            </p>
                            <p className="font-semibold text-neutral-200">
                                By checking the "I read and agree to the Terms of Use and Digital Custody" box and proceeding with payment, you declare that you have full civil capacity and expressly and fully agree to the following clauses:
                            </p>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">1. Object of the Service</h2>
                                <p>
                                    <strong>1.1.</strong> Aevum provides a digital platform that allows the User to upload digital files (texts, images, videos, audios, and documents), set a future date for their unlocking ("Awakening"), and indicate one or more recipients.
                                </p>
                                <p>
                                    <strong>1.2.</strong> The service is provided under a One-Time Payment model (One-time fee), calculated based on the storage size in Gigabytes (GB) contracted and the custody time selected by the User at the time of the Capsule's creation.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">2. Third-Party Infrastructure and Limitation of Liability</h2>
                                <p>
                                    <strong>2.1.</strong> The User declares to be aware that Aevum acts as a software interface layer and that the definitive physical storage of files is performed by world-class subcontractors, specifically on the Amazon Web Services (AWS) cloud infrastructure, using AWS Glacier technology.
                                </p>
                                <p>
                                    <strong>2.2.</strong> Aevum is obligated to maintain the financial provisions necessary to pay for the contracted storage with AWS during the entire term chosen by the User.
                                </p>
                                <p>
                                    <strong>2.3.</strong> Due to the technical dependency on global telecommunication networks and third-party servers, Aevum shall not be held liable for failures of force majeure, acts of God, or technical unforeseen events beyond its control, including but not limited to: large-scale Distributed Denial of Service (DDoS) cyberattacks, global unavailability of AWS servers, general failures in the global internet infrastructure, or natural disasters that physically affect the data centers used.
                                </p>
                                <p>
                                    <strong>2.4. (International Data Transfer)</strong> The User declares to be aware of and expressly consents that their files and registration data will be stored and processed on secure AWS cloud servers located in the United States of America (us-east-1 region), in compliance with AWS global security standards.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">3. Right of Withdrawal and Refund Policy</h2>
                                <p>
                                    <strong>3.1.</strong> In strict compliance with Article 49 of the Brazilian Consumer Defense Code (CDC), the User has the right to withdraw from the contract within 7 (seven) calendar days, starting from the date of payment confirmation and sealing of the Capsule.
                                </p>
                                <p>
                                    <strong>3.2.</strong> If the User exercises the Right of Withdrawal within the legal 7-day period, a full refund of the amount paid will be processed automatically through the payment gateway used (Stripe), and consequently, all files linked to the respective Capsule will be permanently and irreversibly deleted from Aevum and AWS servers.
                                </p>
                                <p>
                                    <strong>3.3.</strong> After the lapse of the 7 (seven) calendar days period, there will be no returns, chargebacks, or refunds, full or partial, of the amounts paid, given that the long-term storage and custody infrastructure with AWS is contracted deterministically and immediately by the platform.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">4. Prohibited Content and Criminal Liability Waiver</h2>
                                <p>
                                    <strong>4.1.</strong> The User is solely, exclusively, and fully responsible — both civilly and criminally — for the content of the files inserted in their Time Capsule.
                                </p>
                                <p>
                                    <strong>4.2.</strong> It is expressly prohibited to upload any file that constitutes a crime under Brazilian and international law, including but not limited to: child pornography or child exploitation material, copyrighted content without proper authorization (piracy), bank details or confidential information obtained unlawfully, or promotion of crimes.
                                </p>
                                <p>
                                    <strong>4.3.</strong> Since files are transmitted privately, Aevum does not perform prior monitoring of content. However, if the platform is compelled by a court order or notification from a competent authority, Aevum will cooperate fully with the authorities, providing the registration data of the User who created the Capsule.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">5. Access Rule, Post-Mortem, and Succession</h2>
                                <p>
                                    <strong>5.1.</strong> The delivery and right of access to the Capsule's content on the date of the "Awakening" belong exclusively to the owner of the email address indicated as the recipient by the User at the time of creation, or to the User themselves through valid access credentials.
                                </p>
                                <p>
                                    <strong>5.2.</strong> In case of the User's death before the Capsule's Awakening date, the platform will keep the original release schedule unchanged.
                                </p>
                                <p>
                                    <strong>5.3.</strong> The early opening of any Capsule by third parties or legitimate heirs of the User will not be permitted administratively, in order to safeguard the privacy and original will of the creator, except upon presentation of a specific court order (judicial authorization or warrant) that expressly determines the release of the files to the legal successors.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">6. Governing Law and Forum</h2>
                                <p>
                                    <strong>6.1.</strong> To resolve any doubts or disputes arising from this Agreement, the forum of the domicile of the Founders of the Aevum Platform is elected, with express waiver of any other, however privileged it may be.
                                </p>
                                <p>
                                    <strong>6.2. (International Users and Local Compliance)</strong> Users accessing the platform outside the Brazilian territory are solely responsible for ensuring compliance with the laws and regulations of their respective countries of residence. The use of Aevum services is prohibited in any jurisdiction where the object of this contract or the content inserted by the User is considered unlawful.
                                </p>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6 text-sm leading-relaxed font-light text-neutral-400">
                            <p>
                                Seja bem-vindo à Aevum (disponível via <a href="https://myaevum.space" className="text-amber-500 hover:underline">https://myaevum.space</a>). Este documento é um contrato jurídico ("Contrato") entre você ("Usuário") e os Fundadores e Administradores da Plataforma Aevum ("Aevum"), que regula o uso do nosso serviço de selagem, armazenamento e envio programado de dados digitais ("Cápsulas do Tempo").
                            </p>
                            <p className="font-semibold text-neutral-200">
                                Ao marcar a caixa de seleção "Li e concordo com os Termos de Uso e Custódia Digital" e prosseguir com o pagamento, você declara ter capacidade civil e concordar expressa e integralmente com as seguintes cláusulas:
                            </p>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">1. Objeto do Serviço</h2>
                                <p>
                                    <strong>1.1.</strong> A Aevum fornece uma plataforma digital que permite ao Usuário realizar o upload de arquivos digitais (textos, imagens, vídeos, áudios e documentos), definir uma data futura para o seu desbloqueio ("Despertar") e indicar um ou mais destinatários.
                                </p>
                                <p>
                                    <strong>1.2.</strong> O serviço é prestado mediante a modalidade de Pagamento Único (One-time fee), calculado com base no tamanho de armazenamento em Gigabytes (GB) contratado e no tempo de custódia selecionado pelo Usuário no momento da criação da Cápsula.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">2. Infraestrutura de Terceiros e Limitação de Responsabilidade</h2>
                                <p>
                                    <strong>2.1.</strong> O Usuário declara estar ciente de que a Aevum atua como uma camada de interface de software e que o armazenamento físico definitivo dos arquivos é realizado em subcontratados de classe mundial, especificamente na infraestrutura de nuvem da Amazon Web Services (AWS), utilizando a tecnologia AWS Glacier.
                                </p>
                                <p>
                                    <strong>2.2.</strong> A Aevum obriga-se a manter as provisões financeiras necessárias para o custeio do armazenamento contratado junto à AWS durante todo o prazo escolhido pelo Usuário.
                                </p>
                                <p>
                                    <strong>2.3.</strong> Em virtude da dependência técnica de redes globais de telecomunicação e servidores de terceiros, a Aevum não será responsabilizada por falhas de força maior, caso fortuito ou imprevistos técnicos alheios ao seu controle, incluindo, mas não se limitando a: ataques cibernéticos de negação de serviço (DDoS) em larga escala, indisponibilidade global dos servidores da AWS, falhas gerais na infraestrutura da internet global, ou desastres naturais que afetem fisicamente os data centers utilizados.
                                </p>
                                <p>
                                    <strong>2.4. (Transferência Internacional de Dados)</strong> O Usuário declara-se ciente e consente expressamente que seus arquivos e dados cadastrais serão armazenados e processados em servidores de nuvem seguros da AWS localizados nos Estados Unidos da América (região us-east-1), em conformidade com os padrões globais de segurança da AWS.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">3. Direito de Arrependimento e Política de Estorno</h2>
                                <p>
                                    <strong>3.1.</strong> Em estrita observância ao Artigo 49 do Código de Defesa do Consumidor (CDC), o Usuário possui o direito de desistir do contrato no prazo de 7 (sete) dias corridos, a contar da data de confirmação do pagamento e selagem da Cápsula.
                                </p>
                                <p>
                                    <strong>3.2.</strong> Caso o Usuário exerça o Direito de Arrependimento dentro do prazo legal de 7 dias, o reembolso integral do valor pago será processado automaticamente através do gateway de pagamento utilizado (Stripe) e, ato contínuo, todos os arquivos vinculados à respectiva Cápsula serão permanentemente e irreversivelmente excluídos dos servidores da Aevum e da AWS.
                                </p>
                                <p>
                                    <strong>3.3.</strong> Após o decurso do prazo de 7 (sete) dias corridos, não haverá devolução, estorno ou reembolso, total ou parcial, dos valores pagos, tendo em vista que a infraestrutura de armazenamento e custódia de longo prazo junto à AWS é contratada de forma determinística e imediata pela plataforma.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">4. Conteúdo Proibido e Isenção de Responsabilidade Criminal</h2>
                                <p>
                                    <strong>4.1.</strong> O Usuário é o único, exclusivo e integral responsável — civil e criminalmente — pelo conteúdo dos arquivos inseridos em sua Cápsula do Tempo.
                                </p>
                                <p>
                                    <strong>4.2.</strong> É expressamente proibido o upload de qualquer arquivo que configure crime sob a legislação brasileira e internacional, incluindo, mas não se limitando a: material de pornografia ou exploração infantojuvenil, conteúdo protegido por direitos autorais sem a devida autorização (pirataria), dados bancários ou informações sigilosas obtidas de forma ilícita, ou apologia a crimes.
                                </p>
                                <p>
                                    <strong>4.3.</strong> Como os arquivos são transmitidos de forma privada, a Aevum não realiza monitoramento prévio do conteúdo. Contudo, caso a plataforma seja compelida por ordem judicial ou notificação de autoridade competente, a Aevum colaborará integralmente com as autoridades, fornecendo os dados cadastrais do Usuário criador da Cápsula.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">5. Regra de Acesso, Pós-Morte e Sucessão</h2>
                                <p>
                                    <strong>5.1.</strong> A entrega e o direito de acesso ao conteúdo da Cápsula na data do "Despertar" pertencem exclusivamente ao titular do endereço de e-mail indicado como destinatário pelo Usuário no momento da criação, ou ao próprio Usuário através de suas credenciais de acesso válidas.
                                </p>
                                <p>
                                    <strong>5.2.</strong> Em caso de falecimento do Usuário antes da data do Despertar da Cápsula, a plataforma manterá o cronograma de liberação original inalterado.
                                </p>
                                <p>
                                    <strong>5.3.</strong> A abertura antecipada de qualquer Cápsula por terceiros ou herdeiros legítimos do Usuário não será permitida administrativamente, visando resguardar a privacidade e a vontade original do criador, salvo mediante apresentação de ordem judicial específica (alvará judicial ou mandado) que determine expressamente a liberação dos arquivos aos sucessores legais.
                                </p>
                            </section>

                            <section className="space-y-3 pt-4">
                                <h2 className="text-lg font-serif text-white font-medium">6. Foro de Eleição</h2>
                                <p>
                                    <strong>6.1.</strong> Para dirimir quaisquer dúvidas ou litígios decorrentes deste Contrato, fica eleito o foro da comarca de domicílio dos Fundadores da Plataforma Aevum, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                                </p>
                                <p>
                                    <strong>6.2. (Usuários Internacionais e Conformidade Local)</strong> Usuários acessando a plataforma fora do território brasileiro são exclusivamente responsáveis por garantir a conformidade com as leis e regulamentações de seus respectivos países de residência. O uso dos serviços Aevum é proibido em qualquer jurisdição onde o objeto deste contrato ou o conteúdo inserido pelo Usuário seja considerado ilícito.
                                </p>
                            </section>
                        </div>
                    )}
                </motion.div>
            </article>
        </main>
    );
}
