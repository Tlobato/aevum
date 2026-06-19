"use client";

import { X, Shield, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
}

export function TermsModal({ isOpen, onClose, onAgree }: TermsModalProps) {
    const { t, i18n } = useTranslation();
    const isEn = i18n.language?.startsWith("en");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-neutral-900/95 border border-neutral-800 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(245,158,11,0.1)] flex flex-col max-h-[85vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/5 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Shield className="w-5 h-5 text-amber-500" />
                        <h3 className="font-serif text-lg text-white font-light">
                            {isEn ? "Terms of Use & Digital Custody" : "Termos de Uso e Custódia Digital"}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-neutral-500 hover:text-white hover:scale-110 active:scale-95 transition-all p-1 bg-white/5 rounded-full cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-neutral-400 font-light leading-relaxed select-none">
                    {isEn ? (
                        <div className="space-y-6">
                            <p>
                                Welcome to Aevum (available via <a href="https://myaevum.space" target="_blank" className="text-amber-500 hover:underline">https://myaevum.space</a>). This document is a legal agreement ("Agreement") between you ("User") and the Founders and Administrators of the Aevum Platform ("Aevum"), which regulates the use of our digital data sealing, storage, and scheduled delivery service ("Time Capsules").
                            </p>
                            <p className="font-medium text-neutral-200">
                                By proceeding, you declare that you have full civil capacity and expressly and fully agree to the following clauses:
                            </p>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">1. Object of the Service</h4>
                                <p><strong>1.1.</strong> Aevum provides a digital platform that allows the User to upload digital files (texts, images, videos, audios, and documents), set a future date for their unlocking ("Awakening"), and indicate one or more recipients.</p>
                                <p><strong>1.2.</strong> The service is provided under a One-Time Payment model (One-time fee), calculated based on the storage size in Gigabytes (GB) contracted and the custody time selected by the User at the time of the Capsule's creation.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">2. Third-Party Infrastructure and Limitation of Liability</h4>
                                <p><strong>2.1.</strong> The User declares to be aware that Aevum acts as a software interface layer and that the definitive physical storage of files is performed by world-class subcontractors, specifically on the Amazon Web Services (AWS) cloud infrastructure, using AWS Glacier technology.</p>
                                <p><strong>2.2.</strong> Aevum is obligated to maintain the financial provisions necessary to pay for the contracted storage with AWS during the entire term chosen by the User.</p>
                                <p><strong>2.3.</strong> Due to the technical dependency on global telecommunication networks and third-party servers, Aevum shall not be held liable for failures of force majeure, acts of God, or technical unforeseen events beyond its control, including but not limited to: cyberattacks, global unavailability of AWS servers, or general internet outages.</p>
                                <p><strong>2.4. (International Data Transfer)</strong> The User declares to be aware of and expressly consents that their files and registration data will be stored and processed on secure AWS cloud servers located in the United States of America (us-east-1 region).</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">3. Right of Withdrawal and Refund Policy</h4>
                                <p><strong>3.1.</strong> In strict compliance with Article 49 of the Brazilian Consumer Defense Code (CDC), the User has the right to withdraw from the contract within 7 (seven) calendar days, starting from the date of payment confirmation.</p>
                                <p><strong>3.2.</strong> If the User exercises the Right of Withdrawal, a full refund of the amount paid will be processed automatically via Stripe, and all files linked to the Capsule will be permanently and irreversibly deleted.</p>
                                <p><strong>3.3.</strong> After the lapse of the 7-day period, there will be no returns, chargebacks, or refunds, full or partial, of the amounts paid.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">4. Prohibited Content and Criminal Liability Waiver</h4>
                                <p><strong>4.1.</strong> The User is solely, exclusively, and fully responsible — both civilly and criminally — for the content of the files inserted in their Time Capsule.</p>
                                <p><strong>4.2.</strong> It is expressely prohibited to upload any file that constitutes a crime under Brazilian and international law, including pornography or child exploitation material, copyrighted content without authorization (piracy), or promotion of crimes.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">5. Access Rule, Post-Mortem, and Succession</h4>
                                <p><strong>5.1.</strong> The delivery and right of access to the Capsule's content on the date of the "Awakening" belong exclusively to the owner of the email address indicated as the recipient by the User at the time of creation.</p>
                                <p><strong>5.2.</strong> In case of the User's death before the Capsule's Awakening date, the platform will keep the original release schedule unchanged.</p>
                                <p><strong>5.3.</strong> The early opening of any Capsule by third parties or legitimate heirs of the User will not be permitted administratively, except upon presentation of a specific court order.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">6. Governing Law and Forum</h4>
                                <p><strong>6.1.</strong> To resolve any doubts or disputes arising from this Agreement, the forum of the domicile of the Founders of the Aevum Platform is elected.</p>
                                <p><strong>6.2. (International Users and Local Compliance)</strong> Users accessing the platform outside the Brazilian territory are solely responsible for ensuring compliance with the laws and regulations of their respective countries of residence.</p>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p>
                                Seja bem-vindo à Aevum (disponível via <a href="https://myaevum.space" target="_blank" className="text-amber-500 hover:underline">https://myaevum.space</a>). Este documento é um contrato jurídico ("Contrato") entre você ("Usuário") e os Fundadores e Administradores da Plataforma Aevum ("Aevum"), que regula o uso do nosso serviço de selagem, armazenamento e envio programado de dados digitais ("Cápsulas do Tempo").
                            </p>
                            <p className="font-medium text-neutral-200">
                                Ao prosseguir, você declara ter capacidade civil e concordar expressa e integralmente com as seguintes cláusulas:
                            </p>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">1. Objeto do Serviço</h4>
                                <p><strong>1.1.</strong> A Aevum fornece uma plataforma digital que permite ao Usuário realizar o upload de arquivos digitais (textos, imagens, vídeos, áudios e documentos), definir uma data futura para o seu desbloqueio ("Despertar") e indicar um ou mais destinatários.</p>
                                <p><strong>1.2.</strong> O serviço é prestado mediante a modalidade de Pagamento Único (One-time fee), calculado com base no tamanho de armazenamento em Gigabytes (GB) contratado e no tempo de custódia selecionado pelo Usuário no momento da criação da Cápsula.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">2. Infraestrutura de Terceiros e Limitação de Responsabilidade</h4>
                                <p><strong>2.1.</strong> O Usuário declara estar ciente de que a Aevum atua como uma camada de interface de software e que o armazenamento físico definitivo dos arquivos é realizado em subcontratados de classe mundial, especificamente na infraestrutura de nuvem da Amazon Web Services (AWS), utilizando a tecnologia AWS Glacier.</p>
                                <p><strong>2.2.</strong> A Aevum obriga-se a manter as provisões financeiras necessárias para o custeio do armazenamento contratado junto à AWS durante todo o prazo escolhido pelo Usuário.</p>
                                <p><strong>2.3.</strong> Em virtude da dependência técnica de redes globais de telecomunicação e servidores de terceiros, a Aevum não será responsabilizada por falhas de força maior, caso fortuito ou imprevistos técnicos alheios ao seu controle, incluindo ataques cibernéticos ou indisponibilidade global dos servidores da AWS.</p>
                                <p><strong>2.4. (Transferência Internacional de Dados)</strong> O Usuário declara-se ciente e consente expressamente que seus arquivos e dados cadastrais serão armazenados e processados em servidores de nuvem seguros da AWS localizados nos Estados Unidos da América (região us-east-1).</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">3. Direito de Arrependimento e Política de Estorno</h4>
                                <p><strong>3.1.</strong> Em estrita observância ao Artigo 49 do Código de Defesa do Consumidor (CDC), o Usuário possui o direito de desistir do contrato no prazo de 7 (sete) dias corridos, a contar da data de confirmação do pagamento e selagem.</p>
                                <p><strong>3.2.</strong> Caso o Usuário exerça o Direito de Arrependimento dentro do prazo legal de 7 dias, o reembolso integral do valor pago será processado automaticamente através do Stripe e, ato contínuo, todos os arquivos serão permanentemente excluídos.</p>
                                <p><strong>3.3.</strong> Após o decurso do prazo de 7 (sete) dias corridos, não haverá devolução, estorno ou reembolso, total ou parcial, dos valores pagos.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">4. Conteúdo Proibido e Isenção de Responsabilidade Criminal</h4>
                                <p><strong>4.1.</strong> O Usuário é o único, exclusivo e integral responsável — civil e criminalmente — pelo conteúdo dos arquivos inseridos em sua Cápsula do Tempo.</p>
                                <p><strong>4.2.</strong> É expressamente proibido o upload de qualquer arquivo que configure crime sob a legislação brasileira e internacional, incluindo pornografia ou exploração infantojuvenil, conteúdo protegido por direitos autorais sem autorização, ou apologia a crimes.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">5. Regra de Acesso, Pós-Morte e Sucessão</h4>
                                <p><strong>5.1.</strong> A entrega e o direito de acesso ao conteúdo da Cápsula na data do "Despertar" pertencem exclusivamente ao titular do endereço de e-mail indicado como destinatário pelo Usuário no momento da criação.</p>
                                <p><strong>5.2.</strong> Em caso de falecimento do Usuário antes da data do Despertar da Cápsula, a plataforma manterá o cronograma de liberação original inalterado.</p>
                                <p><strong>5.3.</strong> A abertura antecipada de qualquer Cápsula por terceiros ou herdeiros legítimos do Usuário não será permitida administrativamente, salvo mediante apresentação de ordem judicial específica.</p>
                            </section>

                            <section className="space-y-2">
                                <h4 className="font-serif text-white font-medium text-base">6. Foro de Eleição</h4>
                                <p><strong>6.1.</strong> Para dirimir quaisquer dúvidas ou litígios decorrentes deste Contrato, fica eleito o foro da comarca de domicílio dos Fundadores da Plataforma Aevum.</p>
                                <p><strong>6.2. (Usuários Internacionais e Conformidade Local)</strong> Usuários acessando a plataforma fora do território brasileiro são exclusivamente responsáveis por garantir a conformidade com as leis e regulamentações de seus respectivos países de residência.</p>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer - Buttons */}
                <div className="border-t border-white/5 px-6 py-4 bg-neutral-950/40 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer"
                    >
                        {isEn ? "Close" : "Fechar"}
                    </button>
                    <button
                        onClick={onAgree}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                    >
                        <Check className="w-3.5 h-3.5" />
                        {isEn ? "Agree and Close" : "Concordar e Fechar"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
