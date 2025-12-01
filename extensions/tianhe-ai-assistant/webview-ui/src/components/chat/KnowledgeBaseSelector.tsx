import React, { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { vscode } from "@/utils/vscode"
import { SelectDropdown, DropdownOptionType } from "@/components/ui/select-dropdown"
import { KnowledgeBase } from "@shared/ExtensionMessage"
import { DatabaseIcon } from "lucide-react"

interface KnowledgeBaseSelectorProps {
	knowledgeBases: KnowledgeBase[]
	selectedId: string | null
	disabled?: boolean
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
	knowledgeBases,
	selectedId,
	disabled = false,
}) => {
	const { t } = useTranslation()

	// 组件挂载时获取知识库列表
	useEffect(() => {
		vscode.postMessage({
			type: "fetchKnowledgeBases",
		})
	}, [])

	// 构建下拉选项
	const options = useMemo(() => {
		const items = [
			// 添加"不使用知识库"选项
			{
				value: "",
				label: "不使用知识库",
				type: DropdownOptionType.ITEM,
			},
		]

		// 如果有知识库，添加分隔符
		if (knowledgeBases.length > 0) {
			items.push({
				value: "separator",
				label: "",
				type: DropdownOptionType.SEPARATOR,
			})

			// 添加所有知识库选项
			knowledgeBases.forEach((kb) => {
				items.push({
					value: kb.id,
					label: kb.applicationName,
					type: DropdownOptionType.ITEM,
				})
			})
		}

		return items
	}, [knowledgeBases])

	// 处理选择变更
	const handleChange = (value: string) => {
		vscode.postMessage({
			type: "selectKnowledgeBase",
			text: value || null,
		})
	}

	// 获取当前选中的显示文本
	const displayValue = selectedId || ""

	// 自定义触发器图标
	const TriggerIcon = () => (
		<DatabaseIcon className="pointer-events-none opacity-80 flex-shrink-0 size-3" />
	)

	return (
		<div className="flex items-center">
			<SelectDropdown
				value={displayValue}
				options={options}
				onChange={handleChange}
				disabled={disabled || knowledgeBases.length === 0}
				title="选择知识库"
				placeholder="选择知识库"
				triggerClassName="max-w-[180px]"
				disableSearch={knowledgeBases.length <= 5}
				triggerIcon={TriggerIcon}
			/>
		</div>
	)
}

export default KnowledgeBaseSelector
