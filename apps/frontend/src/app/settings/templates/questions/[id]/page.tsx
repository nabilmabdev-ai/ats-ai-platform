import QuestionTemplateEditor from '../editor';

export default function EditQuestionTemplatePage({ params }: { params: Promise<{ id?: string }> }) {
    return <QuestionTemplateEditor params={params} />;
}
