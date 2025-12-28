import QuestionTemplateEditor from '../editor';

export default function NewQuestionTemplatePage({ params }: { params: Promise<{ id?: string }> }) {
    return <QuestionTemplateEditor params={params} />;
}
