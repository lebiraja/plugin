"""
Test script for Deep Research Service
Run this to verify the deep research pipeline works end-to-end
"""

import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.deep_research_service import DeepResearchService


async def test_research():
    """Test deep research with a sample query"""

    service = DeepResearchService()

    # Test query
    query = "What are the main benefits and challenges of renewable energy adoption?"

    print(f"🔬 Testing Deep Research Service")
    print(f"Query: {query}")
    print(f"=" * 80)

    try:
        result = await service.conduct_research(
            query=query,
            backend="ollama",  # Change to "lmstudio" if using LM Studio
            model="qwen2.5:3b",  # Change to your model
            max_depth=2,
            max_sources=10,
        )

        print(f"\n✅ Research Complete!")
        print(f"Research ID: {result.research_id}")
        print(f"Time Taken: {result.metadata.time_taken:.2f}s")
        print(f"Sources Consulted: {result.metadata.sources_scraped}")
        print(f"Searches Performed: {result.metadata.searches_performed}")
        print(f"LLM Calls: {result.metadata.llm_calls}")
        print(f"Tokens Used: {result.metadata.tokens_used}")

        print(f"\n📋 Research Plan:")
        print(f"Main Question: {result.plan.main_question}")
        print(f"Sub-Questions ({len(result.plan.sub_questions)}):")
        for i, q in enumerate(result.plan.sub_questions, 1):
            print(f"  {i}. {q}")

        print(f"\n📊 Evidence Quality:")
        for i, e in enumerate(result.evidence[:5], 1):
            print(f"  {i}. {e.title[:60]}... (Score: {e.quality_score:.2f})")

        print(f"\n🧠 Reasoning Trace ({len(result.reasoning_trace)} steps):")
        for step in result.reasoning_trace:
            print(f"\n  Step {step.step}: {step.question}")
            print(f"  Finding: {step.finding[:150]}...")
            print(f"  Confidence: {step.confidence:.2f}")
            if step.contradictions:
                print(f"  Contradictions: {', '.join(step.contradictions)}")

        print(f"\n📝 Final Report:")
        print(f"\nExecutive Summary:")
        print(f"{result.final_report.executive_summary}")

        print(f"\n💡 Key Insights ({len(result.final_report.insights)}):")
        for i, insight in enumerate(result.final_report.insights, 1):
            print(f"  {i}. {insight}")

        print(f"\n🎯 Recommendations ({len(result.final_report.recommendations)}):")
        for i, rec in enumerate(result.final_report.recommendations, 1):
            print(f"  {i}. {rec}")

        print(f"\n⚠️ Caveats ({len(result.final_report.caveats)}):")
        for i, caveat in enumerate(result.final_report.caveats, 1):
            print(f"  {i}. {caveat}")

        print(f"\n📚 Citations ({len(result.citations)}):")
        for citation in result.citations[:5]:
            print(f"  [{citation['id']}] {citation['title']}")
            print(f"      {citation['url']}")

        print(f"\n" + "=" * 80)
        print(f"✅ Test Completed Successfully!")

    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    # Run test
    asyncio.run(test_research())
